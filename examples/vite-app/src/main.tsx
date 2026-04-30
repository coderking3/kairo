import {
  computed,
  createApp,
  defineComponent,
  onMounted,
  onUpdated,
  ref
} from 'kairo'

const NumList = defineComponent(() => {
  console.log('NumList render')

  const list = ref(3)

  onUpdated(() => {
    console.log('NumList updated!')
  })

  return () => (
    <div>
      <h2>Num List</h2>
      <button onClick={() => list.value++}>Add</button>
      <button onClick={() => list.value--}>Remove</button>
      {Array.from({ length: list.value }, (_, i) => (
        <div key={i}>Item {i + 1}</div>
      ))}
    </div>
  )
})

const Counter = defineComponent((props: { initial?: number }) => {
  console.log('Counter render')

  const count = ref(props.initial ?? 0)
  const double = computed(() => count.value * 2)

  onMounted(() => {
    console.log('Counter mounted!')
  })

  return () => (
    <div
      style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginTop: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => count.value--}>-</button>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {count.value}
        </span>
        <button onClick={() => count.value++}>+</button>
      </div>
      <p style={{ color: '#666', marginTop: '0.5rem' }}>
        Double: {double.value}
      </p>
    </div>
  )
})

const App = defineComponent(() => {
  console.log('App render')

  const title = ref('Kairo + Vite + JSX')

  return () => (
    <div
      style={{
        maxWidth: '600px',
        margin: '2rem auto',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <h1>{title.value}</h1>
      <p style={{ color: '#666' }}>
        A lightweight reactive UI framework in action.
      </p>
      <Counter initial={10} />
      <NumList />
    </div>
  )
})

createApp(App).mount('#app')
