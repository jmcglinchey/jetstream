/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { polyfillFieldDefinition } from '@jetstream/shared/ui-utils';
import { ListItem, PicklistFieldValueItem } from '@jetstream/types';
import { Checkbox, DatePicker, Grid, Icon, Input, Picklist, ReadOnlyFormElement, Textarea } from '@jetstream/ui';
import classNames from 'classnames';
import formatISO from 'date-fns/formatISO';
import parseISO from 'date-fns/parseISO';
import startOfDay from 'date-fns/startOfDay';
import uniqueId from 'lodash/uniqueId';
import { Fragment, FunctionComponent, ReactNode, SyntheticEvent, useEffect, useState } from 'react';
import { EditableFields } from './ui-record-form-types';
import { isCheckbox, isDate, isInput, isPicklist, isTextarea } from './ui-record-form-utils';

/* eslint-disable-next-line */
export interface UiRecordFormFieldProps {
  field: EditableFields;
  saveError?: string;
  disabled?: boolean;
  initialValue: string | boolean | null;
  showFieldTypes: boolean;
  // picklist values are converted to strings prior to emitting
  onChange: (field: EditableFields, value: string | boolean | null, isDirty: boolean) => void;
}

function getUndoKey(name: string) {
  return uniqueId(`undo-key-${name}`);
}
export const UiRecordFormField: FunctionComponent<UiRecordFormFieldProps> = ({
  field,
  saveError,
  disabled,
  initialValue: _initialValue,
  showFieldTypes,
  onChange,
}) => {
  const { label, name, labelHelpText, readOnly, metadata } = field;
  const required = !readOnly && field.required;
  const [id] = useState(uniqueId(name));
  const [key, setKey] = useState(getUndoKey(name));
  const [initialValue] = useState(() => {
    if (_initialValue) {
      if (metadata.type === 'datetime' || metadata.type === 'date') {
        return formatISO(startOfDay(parseISO(_initialValue as string)));
      } else if (metadata.type === 'picklist') {
        return [_initialValue];
      } else if (metadata.type === 'multipicklist') {
        return (_initialValue as string).split(';').sort();
      }
    } else if ((_initialValue == null && isInput(field)) || isTextarea(field)) {
      return '';
    }
    return _initialValue;
  });
  const [value, setValue] = useState(initialValue);
  const [isDirty, setIsDirty] = useState(false);
  const [helpText, setHelpText] = useState<ReactNode>();

  useEffect(() => {
    if (showFieldTypes && !helpText) {
      setHelpText(<span className="slds-text-color_weak">{polyfillFieldDefinition(metadata)}</span>);
    } else if (!showFieldTypes && helpText) {
      setHelpText(null);
    }
  }, [readOnly, showFieldTypes, metadata, helpText]);

  function checkIfDirtyAndEmit(valueOverride?: string | string[] | boolean) {
    const priorDirtyValue = isDirty;
    let newDirtyValue = isDirty;
    if (!readOnly) {
      let tempValue = valueOverride !== undefined ? valueOverride : value;
      let tempInitialValue = initialValue;

      // transform to string for accurate comparison
      if (metadata.type === 'picklist') {
        tempValue = Array.isArray(tempValue) && tempValue.length ? tempValue[0] : '';
        tempInitialValue = Array.isArray(tempInitialValue) && tempInitialValue.length ? tempInitialValue[0] : '';
      } else if (metadata.type === 'multipicklist') {
        tempValue = Array.isArray(tempValue) ? tempValue.sort().join(';') : '';
        tempInitialValue = Array.isArray(tempInitialValue) ? tempInitialValue.join(';') : '';
      }

      if (isDirty && tempValue === tempInitialValue) {
        newDirtyValue = false;
      } else if (!isDirty && tempValue !== tempInitialValue) {
        newDirtyValue = true;
      }

      if (priorDirtyValue !== newDirtyValue) {
        setIsDirty(newDirtyValue);
      }
      onChange(field, tempValue as string | boolean | null, newDirtyValue);
    }
  }

  function handleInputChange(event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setValue(event.currentTarget.value);
  }

  function handleInputBlur(event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) {
    checkIfDirtyAndEmit();
  }

  function handleCheckboxChange(currValue: boolean) {
    setValue(currValue);
    checkIfDirtyAndEmit(currValue);
  }

  function handleDateChange(currValue: Date) {
    const newValue = formatISO(currValue);
    setValue(newValue);
    checkIfDirtyAndEmit(newValue);
  }

  function handlePicklistValueChange(values: ListItem<string, PicklistFieldValueItem>[]) {
    const newValue = values.map((item) => item.value);
    setValue(newValue);
    checkIfDirtyAndEmit(newValue);
  }

  function handleClearInput() {
    setValue('');
    checkIfDirtyAndEmit('');
  }

  function handleUndo() {
    setValue(initialValue);
    setKey(getUndoKey(name));
    checkIfDirtyAndEmit(initialValue as any);
  }

  return (
    <Grid className={classNames('slds-size_1-of-1 slds-p-horizontal--x-small', { 'active-item-yellow-bg': isDirty })} vertical>
      {isDirty && (
        <div
          css={css`
            margin-left: auto;
          `}
        >
          <button className="slds-button slds-button_icon slds-button_icon-bare" onClick={() => handleUndo()}>
            <Icon
              type="utility"
              icon="undo"
              description="Undo"
              title="undo"
              className="slds-button__icon slds-button__icon_hint"
              omitContainer
            />
          </button>
        </div>
      )}
      <div>
        {readOnly && (
          <ReadOnlyFormElement
            id={id}
            label={label}
            className="slds-m-bottom_x-small"
            errorMessage={saveError}
            labelHelp={labelHelpText}
            helpText={helpText}
            isRequired={required}
            hasError={!!saveError}
            errorMessageId={`${id}-error`}
            value={(value as string) || ''}
            bottomBorder
          />
        )}

        {!readOnly && (
          <Fragment>
            {isInput(field) && (
              <Input
                id={id}
                label={label}
                className="slds-form-element_stacked slds-is-editing"
                errorMessage={saveError}
                labelHelp={labelHelpText}
                helpText={helpText}
                isRequired={required}
                hasError={!!saveError}
                errorMessageId={`${id}-error`}
                clearButton={!readOnly && !!value}
                onClear={handleClearInput}
              >
                <input
                  id={id}
                  className="slds-input"
                  required={required}
                  disabled={disabled}
                  value={(value as string) || ''}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  aria-describedby={`${id}-error`}
                  maxLength={field.maxLength}
                  inputMode={field.inputMode}
                  step={field.step}
                />
              </Input>
            )}
            {isCheckbox(field) && (
              <Checkbox
                id={id}
                checked={!!value}
                label={label}
                className="slds-form-element_stacked slds-is-editing"
                isStandAlone
                errorMessage={saveError}
                labelHelp={labelHelpText}
                helpText={helpText}
                isRequired={required}
                hasError={!!saveError}
                errorMessageId={`${id}-error`}
                disabled={disabled}
                onChange={handleCheckboxChange}
              />
            )}
            {isDate(field) && (
              <DatePicker
                key={key}
                id={id}
                label={label}
                className="slds-form-element_stacked slds-is-editing"
                containerDisplay="contents"
                errorMessage={saveError}
                labelHelp={labelHelpText}
                helpText={helpText}
                isRequired={!readOnly && required}
                hasError={!!saveError}
                errorMessageId={`${id}-error`}
                initialSelectedDate={parseISO(value as string)}
                onChange={handleDateChange}
              />
            )}

            {isTextarea(field) && (
              <Textarea
                id={id}
                label={label}
                className="slds-form-element_stacked slds-is-editing"
                errorMessage={saveError}
                labelHelp={labelHelpText}
                helpText={helpText}
                isRequired={required}
                hasError={!!saveError}
                errorMessageId={`${id}-error`}
              >
                <textarea
                  id={id}
                  className="slds-textarea"
                  required={required}
                  disabled={disabled}
                  value={(value as string) || ''}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  aria-describedby={`${id}-error`}
                  maxLength={metadata.length}
                />
              </Textarea>
            )}

            {isPicklist(field) && (
              <Picklist
                key={key}
                id={id}
                label={label}
                className="slds-form-element_stacked slds-is-editing"
                containerDisplay="contents"
                omitMultiSelectPills
                errorMessage={saveError}
                labelHelp={labelHelpText}
                helpText={helpText}
                isRequired={required}
                hasError={!!saveError}
                errorMessageId={`${id}-error`}
                multiSelection={field.metadata.type === 'multipicklist'}
                allowDeselection
                items={field.values}
                selectedItemIds={initialValue as string[]}
                onChange={handlePicklistValueChange}
              ></Picklist>
            )}
          </Fragment>
        )}
      </div>
    </Grid>
  );
};

export default UiRecordFormField;