// Tests for the Provider class LTI methods
// Cvmcosta 2020

const jwt = require('jsonwebtoken')
const nock = require('nock')

const chai = require('chai')
const chaiHttp = require('chai-http')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.use(chaiHttp)

const expect = chai.expect

// Valid complete token
const tokenValid = {
  exp: Math.floor(Date.now() / 1000) + (60 * 60),
  iss: 'http://localhost/moodle',
  aud: 'ClientId',
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': '2',
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': 'https://localhost',
  sub: '2',
  'https://purl.imsglobal.org/spec/lti/claim/lis': { person_sourcedid: '', course_section_sourcedid: '' },
  'https://purl.imsglobal.org/spec/lti/claim/roles': [
    'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator',
    'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
    'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator'
  ],
  'https://purl.imsglobal.org/spec/lti/claim/context': {
    id: '3',
    label: 'Curso Teste',
    title: 'Curso Teste',
    type: [Array]
  },
  'https://purl.imsglobal.org/spec/lti/claim/resource_link': { title: 'teste local', id: '5' },
  'https://purl.imsglobal.org/spec/lti-bos/claim/basicoutcomesservice': {
    lis_result_sourcedid: '{"data":{"instanceid":"5","userid":"22","typeid":"2","launchid":932474241},"hash":"86f641f363947a7c5e8b0007f612f5dda68c3b7a708b9be0812b7132df5b4075"}',
    lis_outcome_service_url: 'https://alfa.educsaite.org/mod/lti/service.php'
  },
  given_name: 'Carlos',
  family_name: 'Vinícius',
  name: 'Carlos Vinícius',
  'https://purl.imsglobal.org/spec/lti/claim/ext': { user_username: 'cvmcosta10@hotmail.com', lms: 'moodle-2' },
  email: 'cvmcosta10@hotmail.com',
  'https://purl.imsglobal.org/spec/lti/claim/launch_presentation': {
    locale: 'pt_br',
    document_target: 'iframe',
    return_url: 'https://alfa.educsaite.org/mod/lti/return.php?course=3&launch_container=3&instanceid=5&sesskey=ejFUKvABeF'
  },
  'https://purl.imsglobal.org/spec/lti/claim/tool_platform': {
    family_code: 'moodle',
    version: '2019052000.02',
    guid: 'alfa.educsaite.org',
    name: 'educSaite',
    description: 'educSaite'
  },
  'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
  'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
  'https://purl.imsglobal.org/spec/lti/claim/custom': {
    resource: 'qualificacao_dos_processos_de_trabalho_na_ABS/EDUCSAITE/TRILHA_4/SAUDE_PESSOA_DEFICIENCIA_INFANCIA/EBOOK_2',
    system_setting_url: 'https://alfa.educsaite.org/mod/lti/services.php/tool/2/custom',
    context_setting_url: 'https://alfa.educsaite.org/mod/lti/services.php/CourseSection/3/bindings/tool/2/custom',
    link_setting_url: 'https://alfa.educsaite.org/mod/lti/services.php/links/{link_id}/custom'
  },
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': {
    scope: [Array],
    lineitems: 'https://alfa.educsaite.org/mod/lti/services.php/3/lineitems?type_id=2',
    lineitem: ''
  },
  'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice': {
    context_memberships_url: 'https://alfa.educsaite.org/mod/lti/services.php/CourseSection/3/bindings/2/memberships',
    service_versions: [Array]
  }
}

const signToken = (token, kid) => {
  const key = '-----BEGIN RSA PRIVATE KEY-----\n' +
  'MIICWgIBAAKBgFayUq/sZYvDX7gHZP1npuQQEZpluAaSb1wcdzGxWP9IKx/Qnezs\n' +
  'QcFWEsCOD+MoS9u7qWtfxQkcC4t62jj0iTpBxA7xcLcmGTL3WHKQ2E7+iUVam4BM\n' +
  'mbR2vr4y9cAaqlu+cjw0aMmXZwPDFq38kVDmpOd2VVh0SoAZz+d6F5uzAgMBAAEC\n' +
  'gYA8ZDOdQHrsBMiklOIQcyeaLmdUug6a5V6VN28AOp3YFhmUK+oWo+yaFK8zWsJO\n' +
  'Zj+RbQPzO98xHUwdeRKSIiWEk0MT0Y7GfOL61dRNoZty9v/Sf88xTm6djPMZg+LU\n' +
  'npQmBgKtjSBFWJAy0NMn3U892lr6iFfYe5OAMg6ARV6RQQJBAJ/KG2Ds4ig0dURH\n' +
  'UK6Smt76uCtI6HGsSSn58sz5kWmfytfsqj0DHA9ZQrJj/WXa6ex6FL4YIgZBtv/T\n' +
  'UZi/zikCQQCK5bOoAfVzYGb6d94LC4P5OtUN77xF92xbRxRwHyvVwXve9W8Qx0Jl\n' +
  '/tdgvds6AxMZszIqX/mw7B7eA8AM6N57AkBI1wXiCjoSH8+xH11NJzGIIfygZqzn\n' +
  'XKVBiFpBTCcYYipCgfUcuPUqngMEdQZHTyLBlOktuqyP85brSbZxjkX5AkBIKINI\n' +
  'EhRw5zE4iBNby5S5Yt4SimxWMO8jEG9GvHrqZsUylHEp10rgcB92S8vbfINsw5KZ\n' +
  'PxkZ1+FFV89rJYOHAkBsNl1+JXvUa6U5CsKwVzjoBmW+hvGBiuTYsxRbvjdLlsEn\n' +
  '8TMKXIcwoXmy5rqK3fQ9tDg7smgzC/MPJSiI7V+z\n' +
  '-----END RSA PRIVATE KEY-----'

  if (!kid) return jwt.sign(token, key, { algorithm: 'RS256' })
  return jwt.sign(token, key, { algorithm: 'RS256', keyid: kid })
}

const lti = require('../dist/Provider/Provider')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

describe('Testing LTI 1.3 flow', function () {
  this.timeout(10000)

  it('Login route with unregistered platform is expected to return 401 error', async () => {
    const url = lti.loginRoute()
    return chai.request(lti.app).post(url).send({ iss: 'https://unregisteredPlatform.com' }).then(res => {
      expect(res).to.have.status(401)
    })
  })

  it('Login route POST request with registered platform is expected to redirect to authenticationEndpoint', async () => {
    const url = lti.loginRoute()
    return chai.request(lti.app).post(url).send({ iss: 'http://localhost/moodle' }).then(res => {
      expect(res).to.redirectTo(/^http:\/\/localhost\/moodle\/AuthorizationUrl.*/)
      expect(res).to.have.status(404)
    })
  })

  it('Login route GET request with registered platform is expected to redirect to authenticationEndpoint', async () => {
    const url = lti.loginRoute()
    return chai.request(lti.app).get(url).query({ iss: 'http://localhost/moodle' }).then(res => {
      expect(res).to.redirectTo(/^http:\/\/localhost\/moodle\/AuthorizationUrl.*/)
      expect(res).to.have.status(404)
    })
  })

  it('MainApp route receiving no idToken is expected to redirect to the invalidtoken route', async () => {
    const url = lti.appRoute()
    return chai.request(lti.app).post(url).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  // IMS Certification tests
  it('BadPayload - No KID sent in JWT header. Expected to redirect to invalid token route', async () => {
    const payload = signToken(tokenValid)
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Incorrect KID in JWT header. Expected to redirect to invalid token route', async () => {
    const payload = signToken(tokenValid, 'WRONGKID')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Wrong LTI Version. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    token['https://purl.imsglobal.org/spec/lti/claim/version'] = '2.3'
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - No LTI Version. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    delete token['https://purl.imsglobal.org/spec/lti/claim/version']
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Invalid LTI message. Expected to redirect to invalid token route', async () => {
    const payload = {
      name: 'badltilaunch'
    }
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Missing LTI Claims. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    delete token['https://purl.imsglobal.org/spec/lti/claim/message_type']
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Timestamps Incorrect. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    token.iat = 11111
    token.exp = 22222
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Messsage Type Claim Missing. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    delete token['https://purl.imsglobal.org/spec/lti/claim/message_type']
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Role Claim Missing. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    delete token['https://purl.imsglobal.org/spec/lti/claim/roles']
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Deployment Id Claim Missing. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    delete token['https://purl.imsglobal.org/spec/lti/claim/deployment_id']
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - Resource Link Id Claim Missing. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    delete token['https://purl.imsglobal.org/spec/lti/claim/resource_link'].id
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('BadPayload - User Claim Missing. Expected to redirect to invalid token route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    delete token.sub
    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;']).then(res => {
      expect(res).to.redirectTo(new RegExp('.*' + lti.invalidTokenRoute()))
    })
  })
  it('ValidPayload. Expected to return status 200', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)

    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;', 'ltiaHR0cDovL2xvY2FsaG9zdC9tb29kbGUy=s%3A2.ZezwPKtv3Uibp4A%2F6cN0UzbIQlhA%2BTAKvbtN%2FvgGaCI; Path=/; HttpOnly; SameSite=None']).then(res => {
      expect(res).to.have.status(200)
    })
  })
  it('ValidPayload. Expected Provider.redirect to redirect to desired route', async () => {
    const token = JSON.parse(JSON.stringify(tokenValid))
    token.nonce = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)

    const payload = signToken(token, '123456')
    const state = encodeURIComponent([...Array(20)].map(_ => (Math.random() * 36 | 0).toString(36)).join``)
    const url = await lti.appRoute()

    lti.onConnect((token, req, res) => {
      lti.redirect(res, '/finalRoute', { isNewResource: true })
    })

    nock('http://localhost/moodle').get('/keyset').reply(200, {
      keys: [
        { kty: 'RSA', e: 'AQAB', kid: '123456', n: 'VrJSr-xli8NfuAdk_Wem5BARmmW4BpJvXBx3MbFY_0grH9Cd7OxBwVYSwI4P4yhL27upa1_FCRwLi3raOPSJOkHEDvFwtyYZMvdYcpDYTv6JRVqbgEyZtHa-vjL1wBqqW75yPDRoyZdnA8MWrfyRUOak53ZVWHRKgBnP53oXm7M' }
      ]
    })
    return chai.request(lti.app).post(url).type('json').send({ id_token: payload, state: state }).set('Cookie', ['state' + state + '=s%3Ahttp%3A%2F%2Flocalhost%2Fmoodle.fsJogjTuxtbJwvJcuG4esveQAlih67sfEltuwRM6MX0; Path=/; HttpOnly;', 'ltiaHR0cDovL2xvY2FsaG9zdC9tb29kbGUy=s%3A2.ZezwPKtv3Uibp4A%2F6cN0UzbIQlhA%2BTAKvbtN%2FvgGaCI; Path=/; HttpOnly; SameSite=None']).then(res => {
      expect(res.res.req.path.includes('ltik')).to.equal(true)
      expect(res).to.redirectTo(/\/finalRoute/)
    })
  })
})
