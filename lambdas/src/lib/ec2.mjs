import { EC2Client, DescribeInstancesCommand, RunInstancesCommand } from "@aws-sdk/client-ec2";
const LAUNCH_TEMPLATE_ID = "lt-0b0f4d5df35e51017";

const ec2Client = new EC2Client({ region: "us-west-2" });

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

export async function launchInstanceFromTemplate() {
    const params = {
      LaunchTemplate: {
        LaunchTemplateId: LAUNCH_TEMPLATE_ID,
        Version: "$Latest",
      },
      MinCount: 1,
      MaxCount: 1,
    };
  
    try {
      const data = await ec2Client.send(new RunInstancesCommand(params));
      console.log("Success: Instance launched", data.Instances[0].InstanceId);
      return data.Instances[0];
    } catch (err) {
      console.error("Error launching instance", err);
      throw err;
    }
  }
  
