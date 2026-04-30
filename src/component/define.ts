type SetupReturn = (() => any) | { render: () => any }

export function defineComponent<P extends Record<string, any> = any>(
  setup: (props: P) => SetupReturn
): (props: P) => any {
  const component = (props: P): SetupReturn => setup(props)
  ;(component as any).__k_isComponent = true
  ;(component as any).displayName = setup.name || 'KairoComponent'
  return component
}
