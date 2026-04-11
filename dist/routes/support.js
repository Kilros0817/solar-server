"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resend_1 = require("resend");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
router.post('/contactus', async (req, res) => {
    try {
        const { email, subject, message } = req.body;
        let result = await resend.emails.send({
            from: 'Contact Form <no-reply@tomeblock.com>',
            to: 'support@tomeblock.com',
            subject: `[Contact] ${subject}`,
            text: `From: ${email}\n\n${message}`,
        });
        if (!result.error) {
            result = await resend.emails.send({
                from: 'TomeBlock <support@tomeblock.com>',
                to: email,
                subject: `We received your message.`,
                text: `Thank you for contacting us! We will get back to you shortly.`,
            });
            if (!result.error) {
                res.status(200).json({ isSuccess: true });
            }
            else {
                res.status(200).json({ isSuccess: false });
            }
        }
        else {
            res.status(200).json({ isSuccess: false });
        }
    }
    catch (error) {
        res.status(200).json({ isSuccess: false });
    }
});
router.post('/consultation', async (req, res) => {
    try {
        const { fullName, companyName, workEmail, phoneNumber, roleTitle, industry, companySize, departments, otherDepartment, challenges, usingTools, whichTools, improvements, preferredContactMethod, timeWindow, timezone, additionalNotes } = req.body;
        const formatEmailContent = () => {
            let content = `New Consultation Request\n\n`;
            content += `========================================\n`;
            content += `CONTACT INFORMATION\n`;
            content += `========================================\n`;
            content += `Full Name: ${fullName}\n`;
            content += `Company Name: ${companyName}\n`;
            content += `Work Email: ${workEmail}\n`;
            content += `Phone Number: ${phoneNumber || 'Not provided'}\n`;
            content += `Role/Title: ${roleTitle}\n\n`;
            content += `========================================\n`;
            content += `ORGANIZATION OVERVIEW\n`;
            content += `========================================\n`;
            content += `Industry/Sector: ${industry || 'Not provided'}\n`;
            content += `Company Size: ${companySize || 'Not provided'}\n`;
            if (departments && departments.length > 0) {
                content += `Departments Interested:\n`;
                departments.forEach(dept => {
                    content += `  - ${dept}\n`;
                });
                if (otherDepartment) {
                    content += `  - Other: ${otherDepartment}\n`;
                }
            }
            else {
                content += `Departments Interested: Not provided\n`;
            }
            content += `\n`;
            content += `========================================\n`;
            content += `CURRENT WORKFLOW CONTEXT\n`;
            content += `========================================\n`;
            content += `Workflow Challenges/Goals:\n${challenges || 'Not provided'}\n\n`;
            content += `Using Tools: ${usingTools ? 'Yes' : 'No'}\n`;
            if (usingTools && whichTools) {
                content += `Tools Used: ${whichTools}\n`;
            }
            content += `\n`;
            if (improvements && improvements.length > 0) {
                content += `Critical Improvements Sought:\n`;
                improvements.forEach(imp => {
                    content += `  - ${imp}\n`;
                });
            }
            else {
                content += `Critical Improvements Sought: Not provided\n`;
            }
            content += `\n`;
            content += `========================================\n`;
            content += `ENGAGEMENT DETAILS\n`;
            content += `========================================\n`;
            content += `Preferred Contact Method: ${preferredContactMethod || 'Not specified'}\n`;
            content += `Preferred Time Window: ${timeWindow || 'Not specified'}\n`;
            content += `Time Zone: ${timezone || 'Not specified'}\n`;
            content += `\nAdditional Notes:\n${additionalNotes || 'None provided'}\n`;
            return content;
        };
        let result = await resend.emails.send({
            from: 'Consultation Form <no-reply@tomeblock.com>',
            to: 'travis@tomeblock.com',
            subject: `[Consultation Request] ${companyName} - ${fullName}`,
            text: formatEmailContent(),
        });
        if (!result.error) {
            result = await resend.emails.send({
                from: 'TomeBlock <support@tomeblock.com>',
                to: workEmail,
                subject: `We received your consultation request.`,
                text: `Thank you for contacting us! We will get back to you shortly.`,
            });
            if (!result.error) {
                res.status(200).json({ isSuccess: true });
            }
            else {
                res.status(200).json({ isSuccess: false });
            }
        }
        else {
            res.status(200).json({ isSuccess: false });
        }
    }
    catch (error) {
        res.status(200).json({ isSuccess: false });
    }
});
exports.default = router;
