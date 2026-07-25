function renderTemplate(template, item) {
  const labelDef = String(item.labelDef ?? "");
  const label = `${labelDef.charAt(0).toUpperCase()}${labelDef.slice(1)}`;
  return template
    .replaceAll("{labelDef}", labelDef)
    .replaceAll("{LabelDef}", label);
}

export function expandAudioPrompts(manifest) {
  const families = (manifest.families ?? []).flatMap((family) =>
    family.items.flatMap((item) =>
      family.templates.map((template) => ({
        id: `${family.id}-${item.id}-${template.id}`,
        text: renderTemplate(template.text, item),
      })),
    ),
  );
  return [...manifest.prompts, ...families];
}
