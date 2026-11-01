import type { JSX } from 'react';

import { useAllProjects } from '../../hooks/admin/useProjects';
import { useT } from '../../hooks/useI18n';
import { Autocomplete } from '../Autocomplete';

interface ProjectSelectProps {
  value: string;
  onChange: (projectId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  /** Offers a clear button: a filter can mean "every project". */
  clearable?: boolean;
  className?: string;
}

/** The shared project picker, for the template form and the inspections filter. */
export function ProjectSelect({
  value,
  onChange,
  label,
  ...field
}: ProjectSelectProps): JSX.Element {
  const t = useT();
  const projects = useAllProjects();
  return (
    <Autocomplete
      {...field}
      label={label ?? t.projects.selectLabel}
      placeholder={t.projects.selectPlaceholder}
      value={value}
      onChange={onChange}
      options={projects.map((project) => ({
        value: project.id,
        label: project.name,
        code: project.code,
      }))}
    />
  );
}
