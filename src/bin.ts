import sade from 'sade'

const program = sade('vue-typegen')

program.command('gen')
  .describe('Generate type files from Vue components')
  .option('-s, --source <sourceFolder>', 'Source folder')
  .option('-o, --output <outputFolder>', 'Output folder')
  .action<[]>(async (options) => {
    const { generateTypes } = await import('./generate.js')
    const exitCode = await generateTypes({
      sourceFolder: options.source ?? process.cwd(),
      outputFolder: options.output,
    })
    process.exit(exitCode)
  })

program.parse(process.argv)
