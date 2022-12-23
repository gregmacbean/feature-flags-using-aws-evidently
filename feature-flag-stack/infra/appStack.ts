import { Stack, StackProps, aws_appconfig, aws_evidently } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { StageContextSchema } from '../shared/context-types';

const HIDE_FEATURE = 'hideFeature';
const SHOW_FEATURE = 'showFeature';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stage = StageContextSchema.parse(this.node.tryGetContext('stage'));

    const application = new aws_appconfig.CfnApplication(
      this,
      'app-config-application',
      {
        name: 'myproject',
      },
    );

    const environment = new aws_appconfig.CfnEnvironment(
      this,
      'app-config-environment',
      {
        applicationId: application.ref,
        name: `${stage}`,
      },
    );

    const project = new aws_evidently.CfnProject(this, 'evidently-project', {
      name: application.name,
      appConfigResource: {
        applicationId: application.ref,
        environmentId: environment.ref,
      },
    });

    const feature = new aws_evidently.CfnFeature(this, 'my-feature', {
      project: project.name,
      name: 'myfeature',
      variations: [
        {
          booleanValue: false,
          variationName: HIDE_FEATURE,
        },
        {
          booleanValue: true,
          variationName: SHOW_FEATURE,
        },
      ],
    });

    feature.addDependsOn(project);

    const segment = new aws_evidently.CfnSegment(
      this,
      'accounts-ending-with-zero-segment',
      {
        name: 'AccountsEndingWith0',
        description: 'Accounts ending with 0, e.g. 12345670',
        pattern: JSON.stringify({
          AccountID: [{ suffix: '0' }],
        }),
      },
    );

    segment.addDependsOn(project);

    const launch = new aws_evidently.CfnLaunch(this, 'my-feature-launch', {
      project: project.name,
      name: 'myfeaturelaunch',
      executionStatus: {
        status: 'START',
      },
      groups: [
        {
          feature: feature.name,
          variation: HIDE_FEATURE,
          groupName: HIDE_FEATURE,
        },
        {
          feature: feature.name,
          variation: SHOW_FEATURE,
          groupName: SHOW_FEATURE,
        },
      ],
      scheduledSplitsConfig: [
        {
          startTime: '2022-01-01T00:00:00Z',
          groupWeights: [
            {
              groupName: HIDE_FEATURE,
              splitWeight: 100000,
            },
            {
              groupName: SHOW_FEATURE,
              splitWeight: 0,
            },
          ],
          segmentOverrides: [
            {
              evaluationOrder: 10,
              segment: segment.ref,
              weights: [
                {
                  groupName: SHOW_FEATURE,
                  splitWeight: 100000,
                },
                {
                  groupName: HIDE_FEATURE,
                  splitWeight: 0,
                },
              ],
            },
          ],
        },
      ],
    });

    launch.addDependsOn(segment);
    launch.addDependsOn(feature);
  }
}
