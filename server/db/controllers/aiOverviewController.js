import { GoogleGenAI } from "@google/genai"
import { z } from "zod"
import { userSettingModel } from '../models/models.js'
import { AI_INSTRUCTIONS, AI_MODEL } from '../../utils/constants.js'
import { buildFleetBriefing } from './analyticsController.js'

const insightsSchema = z.object({
    insights: z.array(z.object({
        title: z.string().describe('A short headline, at most five words'),
        content: z.string().describe('At most two sentences for the operations manager'),
    })),
})

// The AI overview: four action-oriented cards from the fleet briefing (the
// numbers the dashboard and analytics compute, by device name), in the user's
// language. Each API key is tried in turn.
export async function getAIOverview(req, res) {
    try {
        const briefing = await buildFleetBriefing(req.user)
        if (!briefing) return res.status(200).json({ insights: [] })

        const settings = await userSettingModel.findOne({ userId: req.user.id }).select('appLanguage -_id').lean()
        const instructions = AI_INSTRUCTIONS.replaceAll('{{language}}', settings?.appLanguage === 'he' ? 'Hebrew' : 'English')
        const apiKeys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_SECOND_KEY,
            process.env.GEMINI_API_THIRD_KEY,
            process.env.GEMINI_API_FOURTH_KEY,
        ].filter(Boolean)

        let lastError
        for (let i = 0; i < apiKeys.length; i++) {
            try {
                const response = await new GoogleGenAI({ apiKey: apiKeys[i] }).models.generateContent({
                    model: AI_MODEL,
                    contents: instructions + JSON.stringify(briefing),
                    config: {
                        responseMimeType: 'application/json',
                        responseJsonSchema: insightsSchema.toJSONSchema(),
                    },
                })
                const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
                return res.status(200).json({ insights: JSON.parse(text)?.insights ?? [] })
            } catch (error) {
                lastError = error
                if (i < apiKeys.length - 1) console.warn(`AI overview: API key ${i + 1} failed, trying the next one.`, error?.message)
            }
        }
        res.status(500).json({ message: lastError?.message || 'Failed to generate the AI overview.' })
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to generate the AI overview.' })
    }
}
