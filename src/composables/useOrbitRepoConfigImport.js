import yaml from 'js-yaml'

const sanitizeRelativePath = pathValue => {
  if (!pathValue || typeof pathValue !== 'string') return ''

  const normalized = pathValue
    .replace(/\\/g, '/')
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .filter(segment => segment !== '.' && segment !== '..')

  return normalized.join('/')
}

const encodeRepoPath = filePath => {
  const safePath = sanitizeRelativePath(filePath)
  if (!safePath) return ''

  return safePath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

const parseRepoConfigContent = (content, filePath) => {
  try {
    if (filePath.endsWith('.json')) {
      return JSON.parse(content)
    }

    return yaml.load(content)
  } catch {
    return null
  }
}

const extractPortFromCommand = command => {
  if (!command || typeof command !== 'string') return ''

  const match = command.match(/(?:--port(?:=|\s+)|-p\s+)(\d{1,5})\b/i)
  if (!match) return ''

  return match[1]
}

export function useOrbitRepoConfigImport({
  getBranchName,
  getProjectPath,
  buildOrbitCtaPrefillPayload,
  normalizeAppPortValue,
  normalizeScalarValue,
  upsertEnvVar,
  isCurrentRepoEvaluation,
}) {
  const buildRepoRawFileUrl = (parsed, branchName, filePath, authHeaders = {}) => {
    const hasAuth = authHeaders && (authHeaders.Authorization || authHeaders['PRIVATE-TOKEN'])
    const encodedBranch = encodeURIComponent(branchName || 'main')
    const safePath = sanitizeRelativePath(filePath)
    const encodedPath = encodeRepoPath(filePath)

    if (!encodedPath || !safePath) return ''

    if (parsed.provider === 'github.com') {
      if (hasAuth) {
        return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${encodedPath}?ref=${encodedBranch}`
      }

      return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${encodedBranch}/${encodedPath}`
    }

    if (parsed.provider === 'gitlab.com') {
      if (hasAuth) {
        return `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}/repository/files/${encodeURIComponent(safePath)}/raw?ref=${encodedBranch}`
      }

      return `https://gitlab.com/${parsed.owner}/${parsed.repo}/-/raw/${encodedBranch}/${encodedPath}`
    }

    if (parsed.provider === 'bitbucket.org') {
      return `https://bitbucket.org/${parsed.owner}/${parsed.repo}/raw/${encodedBranch}/${encodedPath}`
    }

    return ''
  }

  const fetchRepositoryFileContent = async (parsed, branchName, filePath, authHeaders = {}) => {
    const url = buildRepoRawFileUrl(parsed, branchName, filePath, authHeaders)
    if (!url) return null

    const headers = { ...authHeaders }
    if (parsed.provider === 'github.com' && headers.Authorization) {
      headers.Accept = 'application/vnd.github.v3.raw'
    }

    const response = await fetch(url, { method: 'GET', headers })
    if (!response.ok) return null

    return await response.text()
  }

  const parseVercelEnvObject = envObject => {
    if (!envObject || typeof envObject !== 'object' || Array.isArray(envObject)) return []

    const envVars = []
    for (const [key, rawValue] of Object.entries(envObject)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

      const normalized = normalizeScalarValue(rawValue)
      if (!normalized) continue

      upsertEnvVar(envVars, key, normalized)
    }

    return envVars
  }

  const buildPrefillPayloadFromVercelConfig = vercelConfig => {
    if (!vercelConfig || typeof vercelConfig !== 'object' || Array.isArray(vercelConfig)) return null

    const source = {}

    const buildCommand = normalizeScalarValue(vercelConfig.buildCommand)
    if (buildCommand) {
      source.buildCommand = buildCommand
    }

    const installCommand = normalizeScalarValue(vercelConfig.installCommand)
    if (installCommand) {
      source.installCommand = installCommand
    }

    let portCandidate = normalizeScalarValue(vercelConfig.port)

    if (!portCandidate && Array.isArray(vercelConfig.builds)) {
      for (const build of vercelConfig.builds) {
        const buildPort = normalizeScalarValue(build?.config?.port)
        if (buildPort) {
          portCandidate = buildPort
          break
        }
      }
    }

    if (!portCandidate) {
      portCandidate = extractPortFromCommand(normalizeScalarValue(vercelConfig.devCommand))
    }

    const normalizedPort = normalizeAppPortValue(portCandidate)
    if (normalizedPort) {
      source.appPort = normalizedPort
    }

    const envVars = []
    parseVercelEnvObject(vercelConfig.env).forEach(env => upsertEnvVar(envVars, env.key, env.value))
    parseVercelEnvObject(vercelConfig.build?.env).forEach(env => upsertEnvVar(envVars, env.key, env.value))

    if (envVars.length > 0) {
      source.envVars = envVars
    }

    if (Object.keys(source).length === 0) return null

    return buildOrbitCtaPrefillPayload(source)
  }

  const loadRepoDeploymentConfig = async (parsed, authHeaders = {}, evaluationGeneration = null) => {
    if (!parsed) return null

    const branchName = getBranchName() || 'main'
    const basePath = sanitizeRelativePath(getProjectPath())

    const preferredPaths = [
      basePath ? `${basePath}/flux.json` : 'flux.json',
      basePath ? `${basePath}/flux.yaml` : 'flux.yaml',
      basePath ? `${basePath}/flux.yml` : 'flux.yml',
      'flux.json',
      'flux.yaml',
      'flux.yml',
    ]

    const candidatePaths = [...new Set(preferredPaths)]
    let hasAnyFluxConfigFile = false

    for (const filePath of candidatePaths) {
      if (!isCurrentRepoEvaluation(evaluationGeneration)) return null

      try {
        const content = await fetchRepositoryFileContent(parsed, branchName, filePath, authHeaders)
        if (!content) continue
        hasAnyFluxConfigFile = true

        const parsedConfig = parseRepoConfigContent(content, filePath)
        if (!parsedConfig || typeof parsedConfig !== 'object') continue

        const prefillPayload = buildOrbitCtaPrefillPayload(parsedConfig)
        if (!prefillPayload) continue

        return {
          filePath,
          payload: prefillPayload,
        }
      } catch {}
    }

    if (hasAnyFluxConfigFile) {
      return null
    }

    const vercelCandidatePaths = [...new Set([
      basePath ? `${basePath}/vercel.json` : 'vercel.json',
      'vercel.json',
    ])]

    for (const filePath of vercelCandidatePaths) {
      if (!isCurrentRepoEvaluation(evaluationGeneration)) return null

      try {
        const content = await fetchRepositoryFileContent(parsed, branchName, filePath, authHeaders)
        if (!content) continue

        const parsedConfig = parseRepoConfigContent(content, filePath)
        if (!parsedConfig || typeof parsedConfig !== 'object') continue

        const prefillPayload = buildPrefillPayloadFromVercelConfig(parsedConfig)
        if (!prefillPayload) continue

        return {
          filePath,
          payload: prefillPayload,
        }
      } catch {}
    }

    return null
  }

  return {
    loadRepoDeploymentConfig,
  }
}
