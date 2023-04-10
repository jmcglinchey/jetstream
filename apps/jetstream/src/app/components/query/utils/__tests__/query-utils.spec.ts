import { parseQuery } from 'soql-parser-js';
import { restoreQuery } from '../query-restore-utils';
import { MOCK_API_DESCRIBE, TEST_ORG_DEFAULT } from '@jetstream/test-utils';
import { mswTestServer } from '@jetstream/test-utils';
import { enableLogger } from '@jetstream/shared/client-logger';
import { ExpressionGroupType } from '@jetstream/types';

function isExpressionGroupType(value: any): value is ExpressionGroupType {
  return Array.isArray(value.rows);
}

enableLogger(false);

// FIXME: this should be globally somewhere
beforeAll(() => mswTestServer.listen());
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => mswTestServer.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => mswTestServer.close());

describe('query-restore', () => {
  test('restore simple query', async () => {
    const query = parseQuery(`SELECT Id, Name, PersonContact.Id, (SELECT Id FROM ChildAccounts) FROM Account`);
    const {
      missingFields,
      missingSubqueryFields,
      missingMisc,
      sObjectsState,
      selectedSObjectState,
      queryFieldsKey,
      queryChildRelationships,
      queryFieldsMapState,
      selectedQueryFieldsState,
      selectedSubqueryFieldsState,
      fieldFilterFunctions,
      filterQueryFieldsState,
      orderByQueryFieldsState,
      groupByQueryFieldsState,
    } = await restoreQuery(TEST_ORG_DEFAULT, query, false);
    // TODO:

    console.log(missingSubqueryFields);

    expect(missingFields).toHaveLength(0);
    expect(missingSubqueryFields.ChildAccounts).toHaveLength(0);
    expect(missingMisc).toHaveLength(0);
    expect(sObjectsState).toHaveLength(MOCK_API_DESCRIBE.data.sobjects.length);
    expect(selectedSObjectState.name).toEqual(MOCK_API_DESCRIBE.data.sobjects.find((sobject) => sobject.name === 'Account')?.name);

    // TODO: queryFieldsMapState

    // Ensure that fields are set correct for the list of available fields
    expect(filterQueryFieldsState.filter((item) => !item.meta.filterable)).toHaveLength(0);
    expect(filterQueryFieldsState.filter((item) => item.meta.filterable)).toHaveLength(filterQueryFieldsState.length);

    expect(orderByQueryFieldsState.filter((item) => !item.meta.sortable)).toHaveLength(0);
    expect(orderByQueryFieldsState.filter((item) => item.meta.sortable)).toHaveLength(orderByQueryFieldsState.length);

    expect(groupByQueryFieldsState.filter((item) => !item.meta.groupable)).toHaveLength(0);
    expect(groupByQueryFieldsState.filter((item) => item.meta.groupable)).toHaveLength(groupByQueryFieldsState.length);

    // Check Selected Fields
    expect(selectedQueryFieldsState.find((item) => item.field === 'Id')).toBeTruthy();
    expect(selectedQueryFieldsState.find((item) => item.field === 'Id')?.metadata?.name).toEqual('Id');

    expect(selectedQueryFieldsState.find((item) => item.field === 'Name')).toBeTruthy();
    expect(selectedQueryFieldsState.find((item) => item.field === 'Name')?.metadata?.name).toEqual('Name');

    expect(selectedQueryFieldsState.find((item) => item.field === 'PersonContact.Id')).toBeTruthy();
    expect(selectedQueryFieldsState.find((item) => item.field === 'PersonContact.Id')?.metadata?.name).toEqual('Id');

    expect(selectedSubqueryFieldsState?.ChildAccounts.find((item) => item.field === 'Id')).toBeTruthy();
    expect(selectedSubqueryFieldsState?.ChildAccounts.find((item) => item.field === 'Id')?.metadata?.name).toEqual('Id');
  });

  test('restore simple query', async () => {
    const query = parseQuery(`
SELECT COUNT(Id) numDuplicates, Name
FROM Account
WHERE Name != NULL
GROUP BY Name
HAVING COUNT(Id) > 1
LIMIT 50
OFFSET 10
    `);
    const {
      missingFields,
      missingSubqueryFields,
      missingMisc,
      sObjectsState,
      selectedSObjectState,
      queryFieldsKey,
      queryChildRelationships,
      queryFieldsMapState,
      selectedQueryFieldsState,
      selectedSubqueryFieldsState,
      fieldFilterFunctions,
      queryGroupByState,
      queryFiltersState,
      queryHavingState,
      filterQueryFieldsState,
      orderByQueryFieldsState,
      groupByQueryFieldsState,
      queryLimit,
      queryLimitSkip,
      queryOrderByState,
      querySoqlState,
    } = await restoreQuery(TEST_ORG_DEFAULT, query, false);
    // TODO:

    console.log(missingSubqueryFields);

    expect(missingFields).toHaveLength(0);
    expect(missingMisc).toHaveLength(0);
    expect(sObjectsState).toHaveLength(MOCK_API_DESCRIBE.data.sobjects.length);
    expect(selectedSObjectState.name).toEqual(MOCK_API_DESCRIBE.data.sobjects.find((sobject) => sobject.name === 'Account')?.name);

    // Check Selected Fields
    expect(selectedQueryFieldsState.find((item) => item.field === 'Id')).toBeTruthy();
    expect(selectedQueryFieldsState.find((item) => item.field === 'Id')?.metadata?.name).toEqual('Id');

    expect(selectedQueryFieldsState.find((item) => item.field === 'Name')).toBeTruthy();
    expect(selectedQueryFieldsState.find((item) => item.field === 'Name')?.metadata?.name).toEqual('Name');

    const nameField = fieldFilterFunctions.find((item) => item.selectedField.field === 'Id');
    expect(nameField).toBeTruthy();
    expect(nameField.selectedFunction).toEqual('COUNT');
    expect(nameField.alias).toEqual('numDuplicates');

    expect(queryGroupByState).toHaveLength(1);
    expect(queryGroupByState[0].field).toEqual('Name');
    expect(queryGroupByState[0].fieldLabel).toEqual('Name');
    expect(queryGroupByState[0].function).toEqual(null);

    expect(queryFiltersState.action).toEqual('AND');
    expect(queryFiltersState.rows).toHaveLength(1);
    let row = queryFiltersState.rows[0];
    if (isExpressionGroupType(row)) {
      expect(false).toBeTruthy();
      return;
    }

    // Validate query filter field
    expect(row.resourceType).toEqual('TEXT');
    expect(row.selected.resourceMeta?.name).toEqual('Name');
    expect(row.selected.resource).toEqual('Name');
    expect(row.selected.function).toEqual(null);
    expect(row.selected.operator).toEqual('isNotNull');
    expect(row.selected.value).toEqual('');

    // Validate query filter field
    expect(queryHavingState.action).toEqual('AND');
    expect(queryHavingState.rows).toHaveLength(1);
    row = queryHavingState.rows[0];
    if (isExpressionGroupType(row)) {
      expect(false).toBeTruthy();
      return;
    }

    expect(row.resourceType).toEqual('TEXT');
    expect(row.selected.resource).toEqual('Id');
    expect(row.selected.resourceMeta?.name).toEqual('Id');
    expect(row.selected.function).toEqual('COUNT');
    expect(row.selected.operator).toEqual('gt');
    expect(row.selected.value).toEqual('1');

    expect(queryLimit).toEqual('50');
    expect(queryLimitSkip).toEqual('10');
  });
});
