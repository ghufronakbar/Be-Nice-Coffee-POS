"use client"

import { Checkbox } from "@/components/ui/checkbox"
import {
  ACCESS_GROUPS,
  type AccessField,
  type AccessMap,
} from "@/lib/access-control"

type UserAccessFieldsProps = {
  values: AccessMap
  disabled?: boolean
  onChange: (field: AccessField, checked: boolean) => void
  onChangeMany: (fields: AccessField[], checked: boolean) => void
}

export function UserAccessFields({
  values,
  disabled = false,
  onChange,
  onChangeMany,
}: UserAccessFieldsProps) {
  function areAllChecked(fields: AccessField[]) {
    return fields.every((field) => values[field])
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900">Hak Akses</p>
        <p className="text-xs text-zinc-500">
          Gunakan checkbox group untuk memilih banyak akses sekaligus.
        </p>
      </div>

      {ACCESS_GROUPS.map((group) => {
        const groupFields = group.fields.map((field) => field.field)
        const isGroupChecked = areAllChecked(groupFields)

        return (
          <div key={group.title} className="rounded-lg border border-zinc-200 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{group.title}</p>
                <p className="text-xs text-zinc-500">{group.description}</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                <Checkbox
                  disabled={disabled}
                  checked={isGroupChecked}
                  onCheckedChange={(checked) => onChangeMany(groupFields, checked === true)}
                />
                Semua {group.title}
              </label>
            </div>

            {group.subgroups ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {group.subgroups.map((subgroup) => (
                  <label
                    key={subgroup.label}
                    className="flex items-center gap-2 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
                  >
                    <Checkbox
                      disabled={disabled}
                      checked={areAllChecked(subgroup.fields)}
                      onCheckedChange={(checked) => onChangeMany(subgroup.fields, checked === true)}
                    />
                    {subgroup.label}
                  </label>
                ))}
              </div>
            ) : null}

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {group.fields.map((accessItem) => (
                <label
                  key={accessItem.field}
                  className="flex items-start gap-2 rounded-md border border-zinc-100 p-2"
                >
                  <Checkbox
                    disabled={disabled}
                    checked={values[accessItem.field]}
                    onCheckedChange={(checked) => onChange(accessItem.field, checked === true)}
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium text-zinc-900">
                      {accessItem.label}
                    </span>
                    <span className="block text-xs text-zinc-500">{accessItem.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
