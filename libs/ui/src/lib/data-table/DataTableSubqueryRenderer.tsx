/* eslint-disable no-fallthrough */
import { logger } from '@jetstream/shared/client-logger';
import { queryMore } from '@jetstream/shared/data';
import { formatNumber, transformTabularDataToExcelStr } from '@jetstream/shared/ui-utils';
import { flattenRecord, flattenRecords } from '@jetstream/shared/utils';
import { SalesforceOrgUi } from '@jetstream/types';
import copyToClipboard from 'copy-to-clipboard';
import { QueryResult } from 'jsforce';
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { FormatterProps } from 'react-data-grid';
import RecordDownloadModal from '../file-download-modal/RecordDownloadModal';
import Grid from '../grid/Grid';
import AutoFullHeightContainer from '../layout/AutoFullHeightContainer';
import Modal from '../modal/Modal';
import { ContextMenuItem } from '../popover/ContextMenu';
import Icon from '../widgets/Icon';
import Spinner from '../widgets/Spinner';
import { DataTableSubqueryContext } from './data-table-context';
import { ColumnWithFilter, RowWithKey, SalesforceQueryColumnDefinition, SubqueryContext } from './data-table-types';
import { getRowId, getSubqueryModalTagline, NON_DATA_COLUMN_KEYS } from './data-table-utils';
import { ContextMenuActionData, DataTable } from './DataTable';

export const SubqueryRenderer: FunctionComponent<FormatterProps<RowWithKey, unknown>> = ({ column, row, onRowChange, isCellSelected }) => {
  const isMounted = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [modalTagline, setModalTagline] = useState<string>();
  const [downloadModalIsActive, setDownloadModalIsActive] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResult<any>>(row[column.key] || {});
  // const [rows, setRows] = useState<RowWithKey[]>([]);
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(() => new Set());

  const { records, nextRecordsUrl } = queryResults;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleRowAction = useCallback((row: any, action: 'view' | 'edit' | 'clone' | 'apex') => {
    // logger.info('row action', row, action);
    // switch (action) {
    //   case 'edit':
    //     onEdit(row);
    //     break;
    //   case 'clone':
    //     onClone(row);
    //     break;
    //   case 'view':
    //     onView(row);
    //     break;
    //   case 'apex':
    //     onGetAsApex(row);
    //     break;
    //   default:
    //     break;
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   if (!records) {
  //     return;
  //   }
  //   const columnKeys = columns?.map((col) => col.key) || null;
  //   setRows(
  //     records.map((row) => {
  //       return {
  //         _key: getRowId(row),
  //         _action: handleRowAction,
  //         // ...row,
  //         ...(columnKeys ? flattenRecord(row, columnKeys, false) : row),
  //       };
  //     })
  //   );
  // }, [handleRowAction, records]);

  function handleViewData() {
    if (isActive) {
      setIsActive(false);
    } else {
      if (!modalTagline) {
        setModalTagline(getSubqueryModalTagline(row));
      }
      setIsActive(true);
    }
  }

  function handleCloseModal(cancelled?: boolean) {
    if (typeof cancelled === 'boolean' && cancelled) {
      setIsActive(true);
      setDownloadModalIsActive(false);
    } else {
      setIsActive(false);
      setDownloadModalIsActive(false);
    }
  }

  function openDownloadModal() {
    setIsActive(false);
    setDownloadModalIsActive(true);
  }

  function handleCopyToClipboard(columns: ColumnWithFilter<any, unknown>[]) {
    const fields = columns.map((column) => column.key);
    const flattenedData = flattenRecords(records, fields);
    copyToClipboard(transformTabularDataToExcelStr(flattenedData, fields), { format: 'text/plain' });
  }

  async function loadMore(org: SalesforceOrgUi, isTooling: boolean) {
    try {
      setIsLoadingMore(true);
      const results = await queryMore(org, nextRecordsUrl, isTooling);
      if (!isMounted.current) {
        return;
      }
      results.queryResults.records = records.concat(results.queryResults.records);
      setQueryResults(results.queryResults);
      setIsLoadingMore(false);
    } catch (ex) {
      if (!isMounted.current) {
        return;
      }
      setIsLoadingMore(false);
    }
  }

  if (!Array.isArray(records) || records.length === 0) {
    return <div />;
  }

  return (
    <DataTableSubqueryContext.Consumer>
      {({ serverUrl, org, columnDefinitions, isTooling, google_apiKey, google_appId, google_clientId }) => {
        return (
          <div>
            {(downloadModalIsActive || isActive) && (
              <ModalDataTable
                isActive={isActive}
                columnKey={column.key}
                modalTagline={modalTagline}
                queryResults={queryResults}
                selectedRows={selectedRows}
                isLoadingMore={isLoadingMore}
                columnDefinitions={columnDefinitions}
                isTooling={isTooling}
                org={org}
                downloadModalIsActive={downloadModalIsActive}
                serverUrl={serverUrl}
                google_apiKey={google_apiKey}
                google_appId={google_appId}
                google_clientId={google_clientId}
                loadMore={loadMore}
                openDownloadModal={openDownloadModal}
                handleCloseModal={handleCloseModal}
                handleCopyToClipboard={handleCopyToClipboard}
                handleRowAction={handleRowAction}
                setSelectedRows={setSelectedRows}
              />
            )}
            <button className="slds-button" onClick={handleViewData}>
              <Icon type="utility" icon="search" className="slds-button__icon slds-button__icon_left" omitContainer />
              {Array.isArray(records) ? `${records.length} Records` : 'View Data'}
            </button>
          </div>
        );
      }}
    </DataTableSubqueryContext.Consumer>
  );
};

interface ModalDataTableProps extends SubqueryContext {
  isActive: boolean;
  columnKey: string;
  modalTagline: string;
  queryResults: QueryResult<any>;
  isLoadingMore: boolean;
  selectedRows: ReadonlySet<string>;
  downloadModalIsActive: boolean;
  loadMore: (org: SalesforceOrgUi, isTooling: boolean) => void;
  openDownloadModal: () => void;
  handleCloseModal: (cancelled?: boolean) => void;
  handleCopyToClipboard: (columns: ColumnWithFilter<any, unknown>[]) => void;
  handleRowAction: (row: any, action: 'view' | 'edit' | 'clone' | 'apex') => void;
  setSelectedRows: (rows: ReadonlySet<string>) => void;
}

function ModalDataTable({
  isActive,
  columnKey,
  modalTagline,
  queryResults,
  selectedRows,
  isLoadingMore,
  columnDefinitions,
  isTooling,
  org,
  downloadModalIsActive,
  serverUrl,
  google_apiKey,
  google_appId,
  google_clientId,
  loadMore,
  openDownloadModal,
  handleCloseModal,
  handleCopyToClipboard,
  handleRowAction,
  setSelectedRows,
}: ModalDataTableProps) {
  const modalRef = useRef();
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuItem[]>([]);

  useEffect(() => {
    setContextMenuItems([
      { label: 'Copy row to clipboard with header', value: 'COPY_ROW' },
      { label: 'Copy row to clipboard without header', value: 'COPY_ROW_NO_HEADER', divider: true },

      { label: 'Copy column to clipboard with header', value: 'COPY_COL' },
      { label: 'Copy column to clipboard without header', value: 'COPY_COL_NO_HEADER', divider: true },

      { label: 'Copy table to clipboard with header', value: 'COPY_TABLE' },
      { label: 'Copy table to clipboard without header', value: 'COPY_TABLE_NO_HEADER' },
    ]);
  }, []);

  const { records, done, totalSize } = queryResults;

  const columns = getColumns(columnDefinitions) || [];
  const columnKeys = columns?.map((col) => col.key) || null;
  const fields = columns.filter((column) => column.key && !NON_DATA_COLUMN_KEYS.has(column.key)).map((column) => column.key);
  const rows = records.map((row) => {
    return {
      _key: getRowId(row),
      _action: handleRowAction,
      _record: row,
      ...(columnKeys ? flattenRecord(row, columnKeys, false) : row),
    };
  });

  function getColumns(subqueryColumns: SalesforceQueryColumnDefinition<any>['subqueryColumns']) {
    return subqueryColumns[columnKey];
  }

  // NOTE: this logic is duplicated in SalesforceRecordDataTable.tsx
  // we could potentially combine them into a single component
  const handleContextMenuAction = useCallback(
    (
      item: ContextMenuItem<'COPY_ROW' | 'COPY_ROW_NO_HEADER' | 'COPY_COL' | 'COPY_COL_NO_HEADER' | 'COPY_TABLE' | 'COPY_TABLE_NO_HEADER'>,
      { row, rows, column, columns }: ContextMenuActionData<RowWithKey>
    ) => {
      let includeHeader = true;
      let recordsToCopy: any[] = [];
      const records = rows.map((row) => row._record);
      const fieldsSet = new Set(fields);
      let fieldsToCopy = columns.map((column) => column.key).filter((field) => fieldsSet.has(field)); // prefer this over fields because it accounts for reordering
      logger.info('row action', item.value, { record: row._record, column });
      // NOTE: FALLTHROUGH IS INTENTIONAL
      switch (item.value) {
        case 'COPY_ROW_NO_HEADER':
          includeHeader = false;
        case 'COPY_ROW':
          recordsToCopy = [row._record];
          break;

        case 'COPY_COL_NO_HEADER':
          includeHeader = false;
        case 'COPY_COL':
          fieldsToCopy = fieldsToCopy.filter((field) => field === column.key);
          recordsToCopy = records.map((row) => ({ [column.key]: row[column.key] }));
          break;

        case 'COPY_TABLE_NO_HEADER':
          includeHeader = false;
        case 'COPY_TABLE':
          recordsToCopy = records;
          break;

        default:
          break;
      }
      if (recordsToCopy.length) {
        const flattenedData = flattenRecords(recordsToCopy, fieldsToCopy);
        copyToClipboard(transformTabularDataToExcelStr(flattenedData, fieldsToCopy, includeHeader), { format: 'text/plain' });
      }
    },
    [fields]
  );

  return (
    <>
      {isActive && (
        <Modal
          ref={modalRef}
          size="lg"
          header={columnKey}
          tagline={modalTagline}
          closeOnBackdropClick
          onClose={handleCloseModal}
          footerClassName="slds-is-relative"
          overrideZIndex={1001}
          additionalOverlayProps={{ shouldCloseOnInteractOutside: () => false }}
          footer={
            <Grid
              align="spread"
              verticalAlign="end"
              divProps={{
                onContextMenu: (ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                },
              }}
            >
              <Grid verticalAlign="end">
                <span className="slds-m-right_small">
                  Showing {formatNumber(records.length)} of {formatNumber(totalSize)} records
                </span>
                {!done && (
                  <button className="slds-button slds-button_neutral" onClick={() => loadMore(org, isTooling)}>
                    Load More
                  </button>
                )}
                {isLoadingMore && <Spinner />}
              </Grid>
              <div>
                <button
                  className="slds-button slds-button_neutral"
                  onClick={() => handleCopyToClipboard(columns)}
                  title="Copy the queried records to the clipboard. The records can then be pasted into a spreadsheet."
                >
                  <Icon type="utility" icon="copy_to_clipboard" className="slds-button__icon slds-button__icon_left" omitContainer />
                  Copy to Clipboard
                </button>
                <button className="slds-button slds-button_brand" onClick={openDownloadModal}>
                  <Icon type="utility" icon="download" className="slds-button__icon slds-button__icon_left" omitContainer />
                  Download Records
                </button>
              </div>
            </Grid>
          }
        >
          <div
            className="slds-scrollable_x"
            onContextMenu={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
            }}
          >
            <AutoFullHeightContainer fillHeight setHeightAttr bottomBuffer={300}>
              <DataTable
                allowReorder
                serverUrl={serverUrl}
                org={org}
                data={rows}
                columns={columns}
                getRowKey={getRowId}
                // onCopy={handleCopy}
                rowHeight={28.5}
                selectedRows={selectedRows}
                onSelectedRowsChange={setSelectedRows as any}
                context={{ portalRefForFilters: modalRef }}
                contextMenuItems={contextMenuItems}
                contextMenuAction={handleContextMenuAction}
              />
            </AutoFullHeightContainer>
          </div>
        </Modal>
      )}
      {downloadModalIsActive && (
        <RecordDownloadModal
          org={org}
          google_apiKey={google_apiKey}
          google_appId={google_appId}
          google_clientId={google_clientId}
          downloadModalOpen
          fields={fields}
          modifiedFields={fields}
          records={records}
          onModalClose={handleCloseModal}
        />
      )}
    </>
  );
}