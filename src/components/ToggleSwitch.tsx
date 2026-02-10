interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  id?: string;
}

export default function ToggleSwitch({ checked, onChange, id }: ToggleSwitchProps) {
  return (
    <label className="toggle-switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="toggle-slider" />
    </label>
  );
}
