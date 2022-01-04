import glob from 'fast-glob'
import fs from 'fs-extra'
import ts from 'typescript'
import { extractScripts } from './util/extract.js'

export interface GenerateTypesOptions {
  sourceFolder: string
  outputFolder: string
}

export async function generateTypes (options: GenerateTypesOptions) {
  const componentFiles = await glob(`${options.sourceFolder}/**/*.vue`)

  const targetFiles: string[] = []

  // Create TS files
  for (const file of componentFiles) {
    const script = extractScripts(file)
    const targetFile = `${file}.ts`
    await fs.writeFile(targetFile, script)
    targetFiles.push(targetFile)
  }

  // Emit D.TS files
  const program = ts.createProgram(targetFiles, {
    outDir: options.outputFolder,
    declaration: true,
    emitDeclarationOnly: true,
  })
  const emitResult = program.emit()

  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!)
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    }
  })

  // Cleanup
  for (const file of targetFiles) {
    await fs.remove(file)
  }

  const exitCode = emitResult.emitSkipped ? 1 : 0
  return exitCode
}