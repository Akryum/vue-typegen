import { extractScripts, extractScriptLines, isExportDefault, isScriptTagEnd, isScriptTagStart, isSetupScript, getVariableName } from './extract.js'

test('is script start', () => {
  expect(isScriptTagStart('<script>')).toBe(true)
  expect(isScriptTagStart('<script lang="ts">')).toBe(true)
  expect(isScriptTagStart('<script lang="ts" setup>')).toBe(true)
  expect(isScriptTagStart('<template>')).toBe(false)
})

test('is script end', () => {
  expect(isScriptTagEnd('</script>')).toBe(true)
  expect(isScriptTagEnd('<script>')).toBe(false)
  expect(isScriptTagEnd('<script lang="ts">')).toBe(false)
  expect(isScriptTagEnd('</template>')).toBe(false)
})

test('is setup script', () => {
  expect(isSetupScript('<script setup>')).toBe(true)
  expect(isSetupScript('<script lang="ts" setup>')).toBe(true)
  expect(isSetupScript('<script>')).toBe(false)
  expect(isSetupScript('<script lang="ts">')).toBe(false)
})

test('is export default', () => {
  expect(isExportDefault('export default {')).toBe(true)
  expect(isExportDefault('export default defineComponent({')).toBe(true)
  expect(isExportDefault('console.log("foo")')).toBe(false)
})

test('get variable name', () => {
  expect(getVariableName('const foo = "foo"')).toBe('foo')
  expect(getVariableName('  let bar')).toBe('bar')
  expect(getVariableName('if (true) {')).toBe(null)
})

test('extract script lines', () => {
  expect(extractScriptLines([
    '<script>',
    'import foo from "foo"',
    'console.log(foo)',
    '</script>',
    '<script setup>',
    'import bar from "bar"',
    'console.log(bar)',
    '</script>',
  ])).toEqual([
    ['normal', ['import foo from "foo"', 'console.log(foo)']],
    ['setup', ['import bar from "bar"', 'console.log(bar)']],
  ])
})

test('extract normal script', () => {
  expect(extractScripts(`<script>
import foo from "foo"
console.log('foo')
export default {
  inheritAttrs: false,
}
</script>`)).toBe(`import foo from "foo"
console.log('foo')
export default {
  inheritAttrs: false,
}`)
})

test('extract setup script', () => {
  expect(extractScripts(`<script setup>
import foo from "foo"
const bar = "bar"
</script>`)).toBe(`import { defineComponent } from "vue"
export default defineComponent({
setup () {
import foo from "foo"
const bar = "bar"
return {bar}
},
})`)
})

test('extract mixed scripts', () => {
  expect(extractScripts(`<script>
import foo from "foo"
console.log('foo')
export default defineComponent({
  inheritAttrs: false,
})
</script>
<script setup>
import foo from "foo"
const bar = "bar"
</script>`)).toBe(`import foo from "foo"
console.log('foo')
export default defineComponent({
setup () {
import foo from "foo"
const bar = "bar"
return {bar}
},
  inheritAttrs: false,
})`)
})
