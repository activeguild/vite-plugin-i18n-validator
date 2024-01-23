import { createFilter } from 'vite'
import { Plugin as VitePlugin} from 'vite'
import fs, { readFileSync } from 'fs'
import pc from 'picocolors'

type Option = {
  baseLocaleFilePath: string
  include?: string | RegExp | Array<string | RegExp>
  exclude?: string | RegExp | Array<string | RegExp>
  prohibitedWords?: string[]
}

type CacheValue = [[string], [Cache]]
type Cache = [[string] | [CacheValue]]

export default function Plugin(option: Option): VitePlugin {
  let cachedBaseLocale: string[] | null = null
  let checkedFiles: string[] = []
  const filter = createFilter(option.include, option.exclude)

  if (!option.baseLocaleFilePath) {
    throw new Error('baseLocaleFilePath is required.')
  }

  const checkNestedProperty = (
    obj: any,
    propertyPath: string
  ): { notFound?: boolean; noValue?: boolean; prohibited?: boolean } | true => {
    const properties = propertyPath.split('.')

    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i]

      if (option.prohibitedWords && option.prohibitedWords.includes(prop)) {
        return { prohibited: true }
      }
      if (!obj.hasOwnProperty(prop)) {
        return { notFound: true }
      } else {
        obj = obj[prop]
        if (!obj) {
          return { noValue: true }
        }
      }
    }

    return true
  }

  const traverse = (json: Record<string, any>, parentKey: string): string[] => {
    const keys = Object.keys(json)
    let arr: string[] = []

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = json[key]

      if (typeof value === 'object') {
        if (parentKey) {
          arr.push(...traverse(value, `${parentKey}.${key}`))
        } else {
          arr.push(...traverse(value, key))
        }
      } else {
        if (parentKey) {
          arr.push(`${parentKey}.${key}`)
        } else {
          arr.push(`${key}`)
        }
      }
    }

    return arr
  }

  const compareWithBaseFile = (json: any, cachedBaseLocale: string[]) => {
    let errors: string[] = []
    for (let i = 0; i < cachedBaseLocale.length; i++) {
      const result = checkNestedProperty(json, cachedBaseLocale[i])
      if (result === true) {
        continue
      }

      if (result.notFound) {
        errors.push(`"${cachedBaseLocale[i]}" is not found.`)
      } else if (result.noValue) {
        errors.push(`"${cachedBaseLocale[i]}" has no value.`)
      } else if (result.prohibited) {
        errors.push(`"${cachedBaseLocale[i]}" is prohibited.`)
      }
    }

    return errors
  }

  try {
    const fileText = fs.readFileSync(option.baseLocaleFilePath, 'utf-8')
    const json = JSON.parse(fileText)

    cachedBaseLocale = traverse(json, '')
  } catch (error) {
    throw new Error('baseLocaleFilePath is invalid.')
  }

  return {
    name: 'vite-plugin-i18n-validator',
    async handleHotUpdate(context) {
      if (!cachedBaseLocale) {
        return
      }

      if (!filter(context.file)) {
        return
      }

      const text = await context.read()

      try {
        const json = JSON.parse(text)

        if (context.file === option.baseLocaleFilePath) {
          cachedBaseLocale = traverse(json, '')
        }

        if (!cachedBaseLocale) {
          return
        }

        const errors = compareWithBaseFile(json, cachedBaseLocale)

        if (errors.length > 0) {
          console.log(pc.yellow(`\n${context.file}`))
          for (let i = 0; i < errors.length; i++) {
            console.error(`- ${errors[i]}`)
          }
        }
      } catch (error) {
        console.error('error :>> ', error)
      }
    },
    buildStart() {
      checkedFiles = []
    },
    transform(_code, id) {
      if (!cachedBaseLocale) {
        return
      }

      if (checkedFiles.includes(id)) {
        return
      }

      if (!filter(id)) {
        return
      }

      try {
        const fileText = readFileSync(id, 'utf-8')
        const json = JSON.parse(fileText)

        const errors = compareWithBaseFile(json, cachedBaseLocale)

        if (errors.length > 0) {
          console.log(pc.yellow(`\n${id}`))
          for (let i = 0; i < errors.length; i++) {
            console.error(`- ${errors[i]}`)
          }
        }

        checkedFiles.push(id)
      } catch (error) {
        console.error('error :>> ', error)
      }
    },
  }
}
