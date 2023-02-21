import { css } from '@emotion/react';
import { logger } from '@jetstream/shared/client-logger';
import { ANALYTICS_KEYS, INDEXED_DB } from '@jetstream/shared/constants';
import { useRollbar } from '@jetstream/shared/ui-utils';
import { MapOf, SalesforceOrgUi } from '@jetstream/types';
import {
  AutoFullHeightContainer,
  ColumnWithFilter,
  DataTable,
  EmptyState,
  FileDownloadModal,
  Grid,
  Icon,
  Modal,
  OpenRoadIllustration,
  SalesforceLogin,
  ScopedNotification,
  setColumnFromType,
  Spinner,
} from '@jetstream/ui';
import classNames from 'classnames';
import localforage from 'localforage';
import { orderBy } from 'lodash';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Column } from 'react-data-grid';
import { useRecoilState, useRecoilValue } from 'recoil';
import * as fromAppState from '../../../app-state';
import { useAmplitude } from '../../core/analytics';
import * as fromJetstreamEvents from '../../core/jetstream-events';
import { DownloadModalData, LoadHistoryFileItem, LoadHistoryItem, LoadHistoryItemWithOrg } from '../load-records-types';
import { getRecordsForDownloadBatchApi } from '../utils/load-records-utils';

const getRowId = ({ uuid }: LoadHistoryItem) => uuid;

interface LoadRecordsHistoryModalProps {
  selectedOrg: SalesforceOrgUi;
  className?: string;
}

export const LoadRecordsHistoryModal = ({ className, selectedOrg }: LoadRecordsHistoryModalProps) => {
  const { trackEvent } = useAmplitude();
  const rollbar = useRollbar();
  const modalRef = useRef();
  const [{ serverUrl, google_apiKey, google_appId, google_clientId }] = useRecoilState(fromAppState.applicationCookieState);
  const [isOpen, setIsOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<LoadHistoryItemWithOrg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setError] = useState<string>(null);
  const [columns, setColumns] = useState<Column<LoadHistoryItemWithOrg>[]>(() => getColumns(serverUrl, selectedOrg));
  const orgsById = useRecoilValue(fromAppState.salesforceOrgsById);
  const [downloadModalData, setDownloadModalData] = useState<DownloadModalData>({ open: false, data: [], header: [], fileNameParts: [] });

  useEffect(() => {
    setColumns(getColumns(serverUrl, selectedOrg));
  }, [selectedOrg, serverUrl]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      (async () => {
        try {
          // TODO: allow org filters like with query histor
          // TODO: need to get org friendly name
          const items = orderBy(
            Object.values((await localforage.getItem<MapOf<LoadHistoryItem>>(INDEXED_DB.KEYS.loadHistory)) || {}).map(
              (item): LoadHistoryItemWithOrg => ({
                ...item,
                orgName: orgsById[item.org]?.label || 'Unknown',
              })
            ),
            ['date'],
            ['desc']
          );
          logger.log('[LOAD HISTORY]', { items });
          setHistoryItems(items);
        } catch (ex) {
          logger.warn('Failed to get load history', ex);
          setError('There was an error retrieving your history.');
          rollbar.error('Failed to get load history', { message: ex.message, stack: ex.stack });
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [isOpen]);

  function getColumns(serverUrl: string, selectedOrg: SalesforceOrgUi): ColumnWithFilter<LoadHistoryItemWithOrg>[] {
    return [
      {
        ...setColumnFromType('orgName', 'text'),
        name: 'Org',
        key: 'orgName',
        width: 250,
        cellClass: 'slds-line-height_reset slds-p-around_x-small',
      },
      {
        ...setColumnFromType('date', 'date'),
        name: 'Finished',
        key: 'date',
        width: 180,
        cellClass: 'slds-line-height_reset slds-p-around_x-small',
      },
      {
        ...setColumnFromType('sObject', 'text'),
        name: 'Object',
        key: 'sObject',
        width: 150,
        cellClass: 'slds-line-height_reset slds-p-around_x-small',
      },
      {
        ...setColumnFromType('operation', 'text'),
        name: 'Type',
        key: 'operation',
        filters: ['SET'],
        width: 80,
        cellClass: 'slds-line-height_reset slds-p-around_x-small',
      },
      {
        name: 'Results',
        key: 'total',
        width: 150,
        formatter: ({ column, row }) => (
          <Grid vertical className="slds-line-height_reset slds-p-around_xx-small">
            <div>Total: {row.total}</div>
            <div className="slds-text-color_success">Success: {row.success}</div>
            <div
              className={classNames('slds-truncate', {
                'slds-text-color_error': row.failure > 0,
                'slds-text-color_success': row.failure === 0,
              })}
            >
              Failed: {row.failure}
            </div>
          </Grid>
        ),
      },
      {
        name: 'Download',
        key: 'download',
        width: 185,
        formatter: ({ column, row }) => (
          <Grid vertical className="slds-line-height_reset slds-p-around_xx-small">
            <div className="slds-m-top_x-small">
              {!row.resultsDataId && row.bulkJobId && (
                <SalesforceLogin
                  serverUrl={serverUrl}
                  org={selectedOrg}
                  returnUrl={`/lightning/setup/AsyncApiJobStatus/page?address=%2F${row.bulkJobId}`}
                  iconPosition="right"
                >
                  View job in Salesforce
                </SalesforceLogin>
              )}
              {row.resultsDataId && (
                <button className="slds-button slds-button_neutral" onClick={() => handleDownloadRecords('RESULTS', 'results', row)}>
                  Download Results
                </button>
              )}
            </div>
          </Grid>
        ),
      },
    ];
  }

  async function handleDownloadRecords(which: 'RESULTS', type: 'results' | 'failures', row: LoadHistoryItemWithOrg) {
    const { data: resultsData } = await localforage.getItem<LoadHistoryFileItem>(row.resultsDataId);
    const { data, header } = getRecordsForDownloadBatchApi(type, row.fieldMapping, resultsData);
    setDownloadModalData({
      open: true,
      data,
      header,
      fileNameParts: [row.operation.toLocaleLowerCase(), row.orgName.toLocaleLowerCase(), type],
    });
  }

  function handleDownloadModalClose() {
    setDownloadModalData({ open: false, data: [], header: [], fileNameParts: [] });
  }

  function handleToggleOpen(open: boolean) {
    setIsOpen(open);
    if (open) {
      trackEvent(ANALYTICS_KEYS.deploy_history_opened);
    }
  }

  return (
    <Fragment>
      <button
        className={classNames('slds-button slds-button_neutral', className)}
        aria-haspopup="true"
        title="View deployment history"
        onClick={() => handleToggleOpen(true)}
      >
        <Icon type="utility" icon="date_time" className="slds-button__icon slds-button__icon_left" omitContainer />
        <span>History</span>
      </button>
      {downloadModalData.open && (
        <FileDownloadModal
          org={selectedOrg}
          google_apiKey={google_apiKey}
          google_appId={google_appId}
          google_clientId={google_clientId}
          data={downloadModalData.data}
          header={downloadModalData.header}
          fileNameParts={downloadModalData.fileNameParts}
          onModalClose={handleDownloadModalClose}
          emitUploadToGoogleEvent={fromJetstreamEvents.emit}
        />
      )}
      {isOpen && (
        <Modal
          ref={modalRef}
          classStyles={css`
            min-height: 70vh;
            max-height: 70vh;
          `}
          hide={downloadModalData.open}
          header="Load Records History"
          closeDisabled={false}
          closeOnBackdropClick={false}
          closeOnEsc={false}
          footer={
            <button className="slds-button slds-button_brand" onClick={() => handleToggleOpen(false)} disabled={false}>
              Close
            </button>
          }
          size="lg"
          onClose={() => handleToggleOpen(false)}
        >
          <div className="slds-is-relative slds-scrollable_x">
            {isLoading && <Spinner />}
            {historyItems?.length === 0 && !isLoading && !errorMessage && (
              <EmptyState headline="You don't have any load history" illustration={<OpenRoadIllustration />}></EmptyState>
            )}
            {errorMessage && (
              <div className="slds-m-around-medium">
                <ScopedNotification theme="error" className="slds-m-top_medium">
                  {errorMessage}
                </ScopedNotification>
              </div>
            )}
            {!!historyItems?.length && (
              <div
                css={css`
                  height: calc(70vh - 2rem);
                `}
              >
                <AutoFullHeightContainer fillHeight setHeightAttr bottomBuffer={170}>
                  <DataTable
                    allowReorder
                    serverUrl={serverUrl}
                    org={selectedOrg}
                    columns={columns}
                    data={historyItems}
                    getRowKey={getRowId}
                    rowHeight={81.25}
                    headerRowHeight={28.5}
                    context={{ portalRefForFilters: modalRef }}
                  />
                </AutoFullHeightContainer>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Fragment>
  );
};

export default LoadRecordsHistoryModal;
