import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apprunner from "aws-cdk-lib/aws-apprunner";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

export interface DominoStackProps extends cdk.StackProps {
  domainName: string;
  githubOwner: string;
  githubRepo: string;
  certificateArn: string;
  hostedZoneId: string;
}

export class DominoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DominoStackProps) {
    super(scope, id, props);

    // ---------------------------------------------------------------
    // ECR — created outside CDK so the first deploy has an image ready
    // Run: aws ecr create-repository --repository-name domino-backend
    // ---------------------------------------------------------------
    const repository = ecr.Repository.fromRepositoryName(
      this,
      "BackendRepo",
      "domino-backend"
    );

    // ---------------------------------------------------------------
    // App Runner
    // ---------------------------------------------------------------

    const accessRole = new iam.Role(this, "AppRunnerAccessRole", {
      assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
    });
    repository.grantPull(accessRole);

    const instanceRole = new iam.Role(this, "AppRunnerInstanceRole", {
      assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
    });
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameters"],
        resources: [
          cdk.Arn.format(
            {
              service: "ssm",
              resource: "parameter",
              resourceName: "domino/*",
            },
            this
          ),
        ],
      })
    );

    const autoScaling = new apprunner.CfnAutoScalingConfiguration(
      this,
      "AutoScaling",
      {
        autoScalingConfigurationName: "domino-backend",
        minSize: 1,
        maxSize: 2,
      }
    );

    const service = new apprunner.CfnService(this, "BackendService", {
      serviceName: "domino-backend",
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        autoDeploymentsEnabled: true,
        imageRepository: {
          imageIdentifier: `${repository.repositoryUri}:latest`,
          imageRepositoryType: "ECR",
          imageConfiguration: {
            port: "8080",
            runtimeEnvironmentSecrets: [
              {
                name: "ConnectionStrings__DefaultConnection",
                value: cdk.Arn.format(
                  {
                    service: "ssm",
                    resource: "parameter",
                    resourceName: "domino/database-url",
                  },
                  this
                ),
              },
              {
                name: "JWT_SECRET_KEY",
                value: cdk.Arn.format(
                  {
                    service: "ssm",
                    resource: "parameter",
                    resourceName: "domino/jwt-secret",
                  },
                  this
                ),
              },
            ],
            runtimeEnvironmentVariables: [
              {
                name: "ASPNETCORE_ENVIRONMENT",
                value: "Production",
              },
              {
                name: "Cors__AllowedOrigins__0",
                value: `https://${props.domainName}`,
              },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: "0.25 vCPU",
        memory: "0.5 GB",
        instanceRoleArn: instanceRole.roleArn,
      },
      autoScalingConfigurationArn:
        autoScaling.attrAutoScalingConfigurationArn,
      healthCheckConfiguration: {
        protocol: "HTTP",
        path: "/api/health",
        interval: 20,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // ---------------------------------------------------------------
    // ACM Certificate — created in us-east-1 via CertificateStack,
    // imported here by ARN (CloudFront requires us-east-1 certs)
    // ---------------------------------------------------------------
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Certificate",
      props.certificateArn
    );

    // ---------------------------------------------------------------
    // S3 Bucket for the frontend SPA
    // ---------------------------------------------------------------
    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ---------------------------------------------------------------
    // CloudFront Function — rewrites non-file URIs to /index.html
    // so React Router works on hard-refresh / direct navigation
    // ---------------------------------------------------------------
    const spaFunction = new cloudfront.Function(this, "SpaRouting", {
      code: cloudfront.FunctionCode.fromInline(
        [
          "function handler(event) {",
          "  var request = event.request;",
          "  if (request.uri.includes('.')) return request;",
          "  request.uri = '/index.html';",
          "  return request;",
          "}",
        ].join("\n")
      ),
    });

    // ---------------------------------------------------------------
    // CloudFront Distribution
    //   /* (default)  → S3  (frontend)
    //   /api/*        → App Runner (backend, caching disabled)
    // ---------------------------------------------------------------
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      domainNames: [props.domainName],
      certificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: spaFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.HttpOrigin(service.attrServiceUrl, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
    });

    // ---------------------------------------------------------------
    // Route53 A record — points apex domain to CloudFront
    // ---------------------------------------------------------------
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      }
    );

    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // ---------------------------------------------------------------
    // GitHub Actions OIDC
    // If your AWS account already has a GitHub OIDC provider, remove
    // the provider below and import the existing one instead:
    //   iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(...)
    // ---------------------------------------------------------------
    const githubOidc = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      "GitHubOidc",
      `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
    );

    const deployRole = new iam.Role(this, "GitHubActionsRole", {
      roleName: "domino-github-actions",
      assumedBy: new iam.FederatedPrincipal(
        githubOidc.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": `repo:${props.githubOwner}/${props.githubRepo}:*`,
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ecr:GetAuthorizationToken"],
        resources: ["*"],
      })
    );
    repository.grantPullPush(deployRole);
    frontendBucket.grantReadWrite(deployRole);
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["cloudfront:CreateInvalidation"],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        ],
      })
    );
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "apprunner:StartDeployment",
          "apprunner:ListServices",
        ],
        resources: [service.attrServiceArn],
      })
    );

    // ---------------------------------------------------------------
    // Stack Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, "CloudFrontDomain", {
      value: distribution.distributionDomainName,
      description: "CNAME your domain to this CloudFront domain",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });

    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: frontendBucket.bucketName,
    });

    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: deployRole.roleArn,
      description: "Add as AWS_ROLE_ARN secret in GitHub repo settings",
    });

    new cdk.CfnOutput(this, "AppRunnerServiceUrl", {
      value: `https://${service.attrServiceUrl}`,
    });

    new cdk.CfnOutput(this, "AppRunnerServiceArn", {
      value: service.attrServiceArn,
      description: "Add as APP_RUNNER_SERVICE_ARN secret in GitHub repo settings",
    });

    new cdk.CfnOutput(this, "EcrRepositoryUri", {
      value: repository.repositoryUri,
    });
  }
}
