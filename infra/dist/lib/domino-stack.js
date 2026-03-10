"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DominoStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
class DominoStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", {
            isDefault: true,
        });
        const securityGroup = new ec2.SecurityGroup(this, "DominoSecurityGroup", {
            vpc,
            allowAllOutbound: true,
            description: "Security group for Domino EC2 instance",
        });
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "Allow SSH");
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow HTTP");
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow HTTPS");
        const userData = ec2.UserData.forLinux();
        userData.addCommands("set -e", 
        // Install .NET runtime (ASP.NET Core) on Amazon Linux 2023
        "sudo dnf update -y", "sudo rpm -Uvh https://packages.microsoft.com/config/amazon/2023/prod.repo || true", "sudo dnf install -y aspnetcore-runtime-10.0", 
        // Install nginx (reverse proxy) and create app directories
        "sudo dnf install -y nginx", "sudo mkdir -p /opt/domino/publish/wwwroot", 
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
EOF'`, "sudo systemctl daemon-reload", "sudo systemctl enable domino");
        const instance = new ec2.Instance(this, "DominoInstance", {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
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
exports.DominoStack = DominoStack;
