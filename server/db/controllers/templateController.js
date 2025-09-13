import { templateModel } from '../models/models.js'



export async function innerCreateTemplate(template) {
    try {
        if (!template)
            throw new Error('Template is missing')
        const newTemplate = await templateModel.insertOne(template)
        if (!newTemplate) throw new Error('Failed to create template')
        return newTemplate
    } catch (error) {
        console.log(error);
        return null
    }
}



