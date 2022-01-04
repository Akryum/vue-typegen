type RawScript = ['normal' | 'setup', string[]]

export function extractScripts (source: string) {
  const lines = source.split('\n')
  const rawScripts = extractScriptLines(lines)
  const normalScripts = rawScripts.filter(([type]) => type === 'normal')
  const setupScripts = rawScripts.filter(([type]) => type === 'setup')

  const finalLines: string[] = []

  for (const rawScript of normalScripts) {
    finalLines.push(...rawScript[1])
  }

  // Export

  let exportIndex = finalLines.findIndex(line => isExportDefault(line))
  if (exportIndex === -1) {
    exportIndex = finalLines.length
    finalLines.push('export default {', '}')
  }

  // add the setup function
  if (setupScripts.length > 0) {
    finalLines.splice(exportIndex + 1, 0, 'setup () {', '},')
    exportIndex++
  }

  const setupVariables: string[] = []

  for (const rawScript of setupScripts) {
    finalLines.splice(exportIndex + 1, 0, ...rawScript[1])
    exportIndex += rawScript[1].length

    for (const line of rawScript[1]) {
      const variable = getVariableName(line)
      if (variable) {
        setupVariables.push(variable)
      }
    }
  }

  // Setup return
  if (setupVariables.length > 0) {
    finalLines.splice(exportIndex + 1, 0, `return {${setupVariables.join(',')}}`)
    exportIndex++
  }

  return finalLines.join('\n')
}

export function isScriptTagStart (line: string) {
  return line.trim().startsWith('<script')
}

export function isScriptTagEnd (line: string) {
  return line.trim() === '</script>'
}

export function isSetupScript (line: string) {
  return line.includes('setup')
}

export function isExportDefault (line: string) {
  return line.trim().startsWith('export default')
}

export function getVariableName (line: string) {
  const matched = /(var|const|let)\s+([\w\d_]+)/.exec(line)
  if (matched) {
    return matched[2]
  }
  return null
}

export function extractScriptLines (lines: string[]): RawScript[] {
  let depth = 0
  const scripts: RawScript[] = []
  let scriptLines: string[] = []

  for (const line of lines) {
    if (isScriptTagStart(line)) {
      depth++
      if (depth === 1) {
        scriptLines = []
        scripts.push([isSetupScript(line) ? 'setup' : 'normal', scriptLines])
      }
    } else if (isScriptTagEnd(line)) {
      depth--
    } else if (depth > 0) {
      scriptLines.push(line)
    }
  }

  if (depth > 0) {
    throw new Error('unclosed script tag')
  }

  return scripts
}
