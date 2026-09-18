import React from 'react';
import { FIELDS, fieldLabel, CONTACT_GROUPS, CONTACT_FIELD_ORDER, APPLICANT_GROUP } from '../utils/fields';

/**
 * Renders one titled block of fields read from the canonical registry, so IDEA Detail
 * and Project Detail always show the same label for the same data.
 * Layout uses the existing detail-page classes (detail-section / detail-grid / detail-full).
 */
export default function FieldSection({
  title,
  fields,
  doc,
  renderValue,
  sectionClassName = 'detail-section',
  gridClassName = 'detail-grid',
}) {
  const render = renderValue || ((key, value) => (value === undefined || value === null || value === '' ? '-' : value));

  return (
    <div className={sectionClassName}>
      <h4 className="detail-section-title">{title}</h4>
      <div className={gridClassName}>
        {fields.map((key) => (
          <p key={key} className={FIELDS[key]?.type === 'textarea' ? 'detail-full' : undefined}>
            <strong>{fieldLabel(key)}:</strong> {render(key, doc?.[key])}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the Applicant block followed by the Project Manager / Project Owner /
 * Technical Support blocks — always the same 4 labels in the same order:
 * Name, Department / Company, Contact Number, Email.
 */
export function ContactFieldSections({ doc, renderValue, sectionClassName, gridClassName }) {
  const groups = [APPLICANT_GROUP, ...CONTACT_GROUPS];
  return groups.map((group) => (
    <FieldSection
      key={group.id}
      title={group.title}
      fields={CONTACT_FIELD_ORDER.map((slot) => group[slot])}
      doc={doc}
      renderValue={renderValue}
      sectionClassName={sectionClassName}
      gridClassName={gridClassName}
    />
  ));
}
