import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface DominoStackProps extends cdk.StackProps {}

export class DominoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DominoStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", {
      isDefault: true,
    });

    const securityGroup = new ec2.SecurityGroup(this, "DominoSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Security group for Domino EC2 instance",
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS"
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "set -e",
      // Install .NET runtime (ASP.NET Core) on Amazon Linux 2023
      "sudo dnf update -y",
      "sudo rpm -Uvh https://packages.microsoft.com/config/amazon/2023/prod.repo || true",
      "sudo dnf install -y aspnetcore-runtime-10.0",
      // Install nginx (reverse proxy) and create app directories
      "sudo dnf install -y nginx",
      "sudo mkdir -p /opt/domino/publish/wwwroot",
      // Create systemd service for the Domino backend
      `sudo bash -c 'cat > /etc/systemd/system/domino.service << "EOF"
[Unit]
Description=Domino .NET Backend
After=network.target

[Service]
WorkingDirectory=/opt/domino/publish
ExecStart=/usr/bin/dotnet Domino.Backend.dll
Environment=ASPNETCORE_ENVIRONMENT=Production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'`,
      "sudo systemctl daemon-reload",
      "sudo systemctl enable domino"
    );

    const instance = new ec2.Instance(this, "DominoInstance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup,
      userData,
    });

    const eip = new ec2.CfnEIP(this, "DominoEip", {
      domain: "vpc",
    });

    new ec2.CfnEIPAssociation(this, "DominoEipAssociation", {
      eip: eip.ref,
      instanceId: instance.instanceId,
    });

    new cdk.CfnOutput(this, "InstanceId", {
      value: instance.instanceId,
    });

    new cdk.CfnOutput(this, "InstancePublicIp", {
      value: instance.instancePublicIp,
    });

    new cdk.CfnOutput(this, "ElasticIp", {
      value: eip.ref,
    });
  }
}

