# braket_client.py

import boto3
from botocore.exceptions import ClientError

class BraketClient:
    def __init__(self, region_name='us-west-2'):
        self.client = boto3.client('braket', region_name=region_name)

    def create_quantum_task(self, device_arn, circuit, shots=1024):
        try:
            response = self.client.create_quantum_task(
                deviceArn=device_arn,
                action=circuit,
                shots=shots
            )
            return response['quantumTaskArn']
        except ClientError as e:
            print(f"Error creating quantum task: {e}")
            return None

    def get_task_status(self, task_arn):
        try:
            response = self.client.get_quantum_task(quantumTaskArn=task_arn)
            return response['status']
        except ClientError as e:
            print(f"Error retrieving task status: {e}")
            return None

    def get_task_result(self, task_arn):
        try:
            response = self.client.get_quantum_task(quantumTaskArn=task_arn)
            return response['result']
        except ClientError as e:
            print(f"Error retrieving task result: {e}")
            return None

    def list_devices(self):
        try:
            response = self.client.list_devices()
            return response['devices']
        except ClientError as e:
            print(f"Error listing devices: {e}")
            return None

# Example usage:
# braket_client = BraketClient()
# devices = braket_client.list_devices()
# print(devices)