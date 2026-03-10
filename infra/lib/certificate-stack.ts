import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface CertificateStackProps extends cdk.StackProps {
  domainName: string;
}

export class CertificateStack extends cdk.Stack {
  public readonly certificateArn: string;
  public readonly hostedZoneId: string;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: props.domainName,
    });

    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    this.certificateArn = certificate.certificateArn;
    this.hostedZoneId = hostedZone.hostedZoneId;

    new cdk.CfnOutput(this, "Nameservers", {
      value: cdk.Fn.join(", ", hostedZone.hostedZoneNameServers!),
      description:
        "Update nameservers at Squarespace to these values, then wait for certificate validation",
    });
  }
}
