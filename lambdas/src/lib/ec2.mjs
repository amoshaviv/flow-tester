import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

export async function getActiveInstancesList() {
  const client = new EC2Client({ region: "us-west-2" });
  const command = new DescribeInstancesCommand({});
  const response = await client.send(command);
  return response.Reservations.map((reservation) => reservation.Instances);
}
// export async function startNewInstance() {
//   const client = new EC2Client({ region: "us-west-2" });
//   const command = new RunInstancesCommand({
//     ImageId: "ami-0c55b159cbfafe1f0",
//     InstanceType: "t4g.small",
//     Architecture: "arm64",
//     MinCount: 1,
//     MaxCount: 1,
//     KeyName: "flowtester",
//     InstanceLifecycle: "spot",
//     VpcId: "vpc-fe486f87",
//     SecurityGroupIds: ["sg-09450fc5648cf9722"],
//   });
//   const response = await client.send(command);
//   return response.Instances;
// }

async function launchInstanceFromTemplate() {
    const params = {
      LaunchTemplate: {
        LaunchTemplateName: "FlowTesterBrowser", // or use LaunchTemplateId
        Version: "$Latest", // or a specific version number like "1"
      },
      MinCount: 1,
      MaxCount: 1,
    };
  
    try {
      const data = await ec2Client.send(new RunInstancesCommand(params));
      console.log("Success: Instance launched", data.Instances[0].InstanceId);
    } catch (err) {
      console.error("Error launching instance", err);
    }
  }
  
