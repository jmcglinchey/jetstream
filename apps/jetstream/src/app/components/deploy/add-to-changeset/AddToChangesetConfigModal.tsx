/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useNonInitialEffect } from '@jetstream/shared/ui-utils';
import { ListItem, SalesforceOrgUi } from '@jetstream/types';
import { Grid, Input, Modal, Picklist, Radio, RadioGroup, SalesforceLogin, Spinner, Textarea } from '@jetstream/ui';
import { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { applicationCookieState } from '../../../app-state';
import OrgLabelBadge from '../../core/OrgLabelBadge';
import { ChangeSetPackage } from '../deploy-metadata.types';
import { useChangesetList } from '../utils/useChangesetList';

export interface AddToChangesetConfigModalProps {
  selectedOrg: SalesforceOrgUi;
  initialPackages?: ListItem<string, ChangeSetPackage>[];
  initialPackage?: string;
  initialDescription?: string;
  onChangesetPackages: (changesetPackages: ListItem<string, ChangeSetPackage>[]) => void;
  onSelection: (changesetPackage: string) => void;
  onClose: () => void;
  onDeploy: (changesetPackage: string, changesetDescription: string, changesetId?: string) => void;
}

export const AddToChangesetConfigModal: FunctionComponent<AddToChangesetConfigModalProps> = ({
  selectedOrg,
  initialPackages,
  initialPackage,
  initialDescription,
  onChangesetPackages,
  onSelection,
  onClose,
  onDeploy,
}) => {
  const [{ serverUrl }] = useRecoilState(applicationCookieState);
  const [changesetEntryType, setChangesetEntryType] = useState<'list' | 'manual'>('list');
  const [changesetPackage, setChangesetPackage] = useState<string>(initialPackage || '');
  const [changesetDescription, setChangesetDescription] = useState<string>(initialDescription || '');
  const [changesetId, setChangesetId] = useState<string>(null);
  const [loading, setLoading] = useState(false);
  const { loadPackages, loading: loadingChangesetPackages, changesetPackages, hasError } = useChangesetList(selectedOrg, initialPackages);

  useEffect(() => {
    if (changesetPackages && changesetPackages.length) {
      onChangesetPackages(changesetPackages);
    }
  }, [changesetPackages, onChangesetPackages]);

  useNonInitialEffect(() => {
    onSelection(changesetPackage);
  }, [changesetPackage, onSelection]);

  function handleSelection(selectedItems: ListItem<string, ChangeSetPackage>[]) {
    if (selectedItems?.length) {
      setChangesetPackage(decodeURIComponent(selectedItems[0].value || ''));
      setChangesetDescription(decodeURIComponent(selectedItems[0].meta?.Description || ''));
      setChangesetId(selectedItems[0].meta?.Id);
    } else {
      setChangesetPackage('');
      setChangesetDescription('');
      setChangesetId(null);
    }
  }

  return (
    <Modal
      header="Add metadata to changeset"
      tagline={
        <div className="slds-align_absolute-center">
          The changeset will be updated in <OrgLabelBadge org={selectedOrg} />
        </div>
      }
      footer={
        <Fragment>
          <button className="slds-button slds-button_neutral" onClick={() => onClose()} disabled={loadingChangesetPackages}>
            Cancel
          </button>
          <button
            className="slds-button slds-button_brand"
            onClick={() => onDeploy(changesetPackage, changesetDescription, changesetId)}
            disabled={loadingChangesetPackages || !changesetPackage}
          >
            Deploy
          </button>
        </Fragment>
      }
      size="lg"
      onClose={onClose}
    >
      <div className="slds-is-relative">
        {loadingChangesetPackages && <Spinner />}

        <ul className="slds-list_dotted">
          <li>
            An Outbound Changeset with a <strong>unique name</strong> must already exist.{' '}
            <SalesforceLogin
              serverUrl={serverUrl}
              org={selectedOrg}
              returnUrl={`/lightning/setup/OutboundChangeSet/home`}
              iconPosition="right"
            >
              Create one here.
            </SalesforceLogin>
          </li>
          <li>This process can be used for outbound changeset or unmanaged packages.</li>
          <li>The last modified user and date will get updated on all the items you are adding to the changeset.</li>
        </ul>

        <RadioGroup
          className="slds-m-top_small slds-m-bottom_x-small"
          idPrefix="package"
          label="Choose changeset from list"
          required
          labelHelp="Salesforce has limited support for obtaining changesets, if your changeset is not shown below, manually enter the name. This list may also include unmanaged packages, which can be used successfully with this process."
        >
          <Radio
            idPrefix="package"
            id="package-list"
            name="package"
            label="Choose changeset from list"
            value="list"
            checked={changesetEntryType === 'list'}
            disabled={loading}
            onChange={(value) => setChangesetEntryType(value as 'list' | 'manual')}
          />
          <Radio
            idPrefix="package"
            id="package-manual-entry"
            name="package"
            label="Manually enter changeset name"
            value="manual"
            checked={changesetEntryType === 'manual'}
            disabled={loading}
            onChange={(value) => setChangesetEntryType(value as 'list' | 'manual')}
          />
        </RadioGroup>

        <div
          css={css`
            margin-bottom: 200px;
          `}
        >
          {changesetEntryType === 'list' && (
            <Grid verticalAlign="end">
              <div className="slds-grow">
                <Picklist
                  isRequired
                  label="Changesets"
                  scrollLength={5}
                  placeholder="Select an Option"
                  items={changesetPackages || []}
                  selectedItemIds={changesetPackage ? [changesetPackage] : undefined}
                  disabled={loadingChangesetPackages || loading}
                  allowDeselection={false}
                  onChange={handleSelection}
                ></Picklist>
              </div>
              <div className="slds-m-horizontal_small">
                <button
                  className="slds-button slds-button_neutral slds-m-top_small"
                  onClick={() => loadPackages()}
                  disabled={loadingChangesetPackages || loading}
                >
                  Refresh Changesets
                </button>
              </div>
            </Grid>
          )}
          {changesetEntryType === 'manual' && (
            <Input
              label="Changesets"
              isRequired
              labelHelp="This is case-sensitive and must match the exact name of the outbound changeset in Salesforce"
            >
              <input
                id="batch-size"
                className="slds-input"
                placeholder="Changeset name"
                value={changesetPackage}
                disabled={loadingChangesetPackages || loading}
                onChange={(event) => setChangesetPackage(event.target.value)}
              />
            </Input>
          )}
          <Textarea id="changeset-description" label="Changeset Description" className="slds-m-top_x-small">
            <textarea
              id="changeset-description"
              className="slds-textarea"
              disabled={loadingChangesetPackages || loading}
              value={changesetDescription}
              onChange={(event) => setChangesetDescription(event.target.value)}
              maxLength={255}
            />
          </Textarea>
        </div>
      </div>
    </Modal>
  );
};

export default AddToChangesetConfigModal;