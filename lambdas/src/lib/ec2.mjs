import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
const LAUNCH_TEMPLATE_NAME = "flow-tester-browser-agent-launch-template";

export async function getActiveInstancesList() {
  const client = new EC2Client({ region: "us-west-2" });
  const command = new DescribeInstancesCommand({});
  const response = await client.send(command);

  // Flatten all instances from all reservations
  const allInstances = (response.Reservations || [])
    .flatMap(reservation => reservation.Instances || []);

  // Filter instances launched with the specific launch template
  const filteredInstances = allInstances.filter(instance => {
    // instance.LaunchTemplate may be undefined
    return (
      instance.LaunchTemplate &&
      (instance.LaunchTemplate.LaunchTemplateName === LAUNCH_TEMPLATE_NAME)
    );
  });

  return filteredInstances;
}

async function launchInstanceFromTemplate() {
    const params = {
      LaunchTemplate: {
        LaunchTemplateName: LAUNCH_TEMPLATE_NAME, // or use LaunchTemplateId
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
  
