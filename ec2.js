const fs = require('fs');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-2' });
const ec2 = new AWS.EC2();
const FILE = './request-id'

function spotPriceHistory(params) {
  const NOW = new Date();
  const instanceType = 'm4.xlarge';

  const spotParams = {
    StartTime: NOW,
    EndTime: NOW,
    ProductDescriptions: ['Linux/UNIX'],
    InstanceTypes: [instanceType],
  };

  return new Promise((resolve, reject) => {
    ec2.describeSpotPriceHistory(spotParams, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function requestSpotInstance(params) {
  const price = params['SpotPriceHistory'][0];
  const userData = new Buffer(fs.readFileSync('./user-data', 'utf8')).toString('base64');
  const spotParams = {
    InstanceCount: 1,
    LaunchSpecification: {
      ImageId: 'ami-fcc19b99',
      InstanceType: price['InstanceType'],
      KeyName: 'id_rsa',
      Placement: {
        AvailabilityZone: price['AvailabilityZone'],
      },
      SecurityGroupIds: [
        'sg-b88d3dd1',
      ],
      UserData: userData,
    },
    SpotPrice: price['SpotPrice'],
    Type: 'one-time',
  };

  return new Promise((resolve, reject) => {
    ec2.requestSpotInstances(spotParams, (err, data) => {
      if (err) return reject(err);
      fs.writeFileSync(FILE, data['SpotInstanceRequests'][0]['SpotInstanceRequestId']);
      resolve(data['SpotInstanceRequests'][0]['State']);
    });
  });
}

function cancelSpotInstance(params) {
  const requestId = fs.readFileSync(FILE, 'utf8');
  const spotParams = {
    SpotInstanceRequestIds: [requestId],
  };

  return new Promise((resolve, reject) => {
    ec2.cancelSpotInstanceRequests(spotParams, (err, data) => {
      if (err) return reject(err);
      fs.unlinkSync(FILE);
      resolve(data);
    });
  });
}

function describeSpotInstance(params) {
  if (!fs.existsSync(FILE)) return Promise.reject('file not exists');

  const requestId = fs.readFileSync(FILE, 'utf8');
  const spotParams = {
    SpotInstanceRequestIds: [requestId],
  };

  return new Promise((resolve, reject) => {
    ec2.describeSpotInstanceRequests(spotParams, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function describeInstances(instance_ids) {
  const instanceParams = {
    InstanceIds: instance_ids,
  };

  return new Promise((resolve, reject) => {
    ec2.describeInstances(instanceParams , (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function terminateInstances(instance_ids) {
  const instanceParams = {
    InstanceIds: instance_ids,
  };

  return new Promise((resolve, reject) => {
    ec2.terminateInstances(instanceParams, (err, data) => {
      if (err) return reject(err);
      fs.unlinkSync(FILE);
      resolve(data);
    });
  });
}

function start(params) {
  return spotPriceHistory(params)
    .then(requestSpotInstance)
}

function finish(params) {
  return describeSpotInstance(params)
    .then(spotResultsToInstanceIds)
    .then(terminateInstances)
}

function ip(params) {
  return describeSpotInstance(params)
    .then(spotResultsToInstanceIds)
    .then(describeInstances)
    .then(publicIp)
}

function spotResultsToInstanceIds(results) {
  return results['SpotInstanceRequests'].map(r => r['InstanceId']);
}

function publicIp(results) {
  return results['Reservations'][0]['Instances'][0]['PublicIpAddress'];
}

module.exports = {
  price: spotPriceHistory,
  status: describeSpotInstance,
  start,
  finish,
  ip,
};
