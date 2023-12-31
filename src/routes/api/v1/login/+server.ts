import type { ApiResponse } from '$lib/types'
import { json, type RequestHandler } from '@sveltejs/kit'
import bcrypt from 'bcrypt'
import { generateJwt, db } from '$lib/util'

export const POST: RequestHandler = async ({ request, cookies }) => {
	const res: ApiResponse = {
		data: null,
		message: null,
		success: false
	}

	if (!request.body) {
		res.message = 'Request does not have a body'
		return json(res, { status: 422 })
	}

	let body
	try {
		body = await request.json()
	} catch (error) {
		res.message = 'Could not parse JSON'
		return json(res, { status: 400 })
	}

	if (!body.username || !body.password) {
		res.message = 'Body must contain a username and a password'
		return json(res, { status: 422 })
	}

	const user = await db.user.findUnique({
		where: {
			username: body.username
		}
	})

	if (!user) {
		res.message = `User with username: '${body.username}' does not exist`
		return json(res, { status: 404 })
	}

	const match = await bcrypt.compare(body.password, user.password)

	if (!match) {
		res.message = 'Password is wrong'
		return json(res, { status: 401 })
	}

	cookies.set('jwt', await generateJwt(user.id), {
		path: '/'
	})

	res.success = true
	return json(res)
}
