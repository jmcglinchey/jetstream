---
id: automation-control
title: Automation Control
description: Jetstream makes it easy to view and mass-disable/enable automation across many objects at the same time.
keywords: [
    salesforce,
    salesforce admin,
    salesforce developer,
    salesforce automation,
    salesforce workbench
    automation control,
    triggers,
    process builder,
    flow,
    workflow rule,
  ]
sidebar_label: Automation Control
slug: /automation-control
---

Automation Control allows you to quickly disable or enable automation in your org with the option to easily rollback your changes.

**The following automation is supported**:

- Apex Triggers
  - _Apex triggers are not supported in production orgs because of Salesforce code coverage requirements_
- Validation Rules
- Workflow Rules
- Record Triggered Flows
- Process Builders

## Object and metadata type selection

Select as many objects as you would like and choose the type of automation that you would like to view.

:::tip

If you choose Process Builders, it may take additional time initially for Jetstream to determine which Process Builders are associated to the selected objects. Jetstream will cache this information so that subsequent visits to this page will be much faster.

:::

<img src={require('./automation-control-object-selection.png').default} alt="Automation control - select objects" />

## Toggling automation

After the page loads, you will see a list of all the metadata items in a table and you can easily toggle which ones are active.

For Process Builders and Record Triggered Flows, you will need to choose the version that you want to activate or deactivate. Only one version can be active at any given time.

:::tip

Before you deploy any changes, you can export the current state of automation in case you need to refer back in the future.

:::

<img src={require('./automation-control-overview.png').default} alt="Automation control overview" />

Pending changes are highlighted in yellow.

<img src={require('./automation-control-toggle.png').default} alt="Automation control pending changes" />

## Deploying changes

When you are ready to deploy your changes, click **Review Changes**. This will display a summary of all changes before making changes in Salesforce.

If you need to make any corrections, click cancel and adjust your selections. Otherwise, click **Deploy Changes** to submit the changes to Salesforce.

<img src={require('./automation-control-review-changes.png').default} alt="Automation control review pending changes" />

### Rolling back you changes

Once the changes are submitted, you will be given the option to roll back the changes. This is useful if you just needed to disable some automation temporarily and want to roll back to the previous state.

To rollback your changes, click the **Rollback** button.

<img src={require('./automation-control-rollback.png').default} alt="Automation control pending changes modal" />

## Exporting metadata

There are two options for exporting your metadata:

1. Export as Zip
2. Export as Spreadsheet

:::info

Exporting will not include any pending changes you have made, it will always match what is currently configured in Salesforce.

:::

### Export as Zip

This option will download a metadata package based on the current state of all metadata in Salesforce. This is a full backup of all the metadata and will allow you to re-deploy the metadata at any point in the future using the [Deploy Metadata > Deploy and Compare Metadata](../deploy/deploy-metadata.md) page and choosing **Upload Metadata Zip**.

#### Re-deploying changes

For Validation Rules and Workflow Rules, re-deploying will also include the configuration in addition to the active state. This means that if you made changes to a Validation Rule, when you re-deploy it would get reverted back to the previous state.

For Flows and Process Builders, re-deploying will only update the active version.

### Export as Spreadsheet

Choosing this option will download a spreadsheet or csv with all of the metadata similar to what is displayed in the table. This is a great option to save a reference to what was active or inactive at a specific point in time.
