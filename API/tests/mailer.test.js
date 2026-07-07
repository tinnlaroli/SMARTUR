import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMail = vi.fn().mockResolvedValue({ messageId: 'abc' });

vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn(() => ({ sendMail })),
    },
}));

const {
    sendEmail,
    sendEmailVerification,
    sendRegistrationConfirmation,
} = await import('../utils/mailer.js');

describe('mailer', () => {
    beforeEach(() => {
        sendMail.mockClear();
        process.env.EMAIL_USER = 'noreply@smartur.online';
    });

    it('sendEmail (password recovery OTP) includes the code and correct subject', async () => {
        await sendEmail('user@example.com', '123456');

        expect(sendMail).toHaveBeenCalledTimes(1);
        const call = sendMail.mock.calls[0][0];
        expect(call.to).toBe('user@example.com');
        expect(call.subject).toMatch(/Código de recuperación/);
        expect(call.text).toContain('123456');
        expect(call.html).toContain('123456');
    });

    it('sendEmailVerification (login OTP) includes the code', async () => {
        await sendEmailVerification('user@example.com', '654321');

        const call = sendMail.mock.calls[0][0];
        expect(call.subject).toMatch(/Código de verificación/);
        expect(call.text).toContain('654321');
        expect(call.html).toContain('654321');
    });

    it('sendRegistrationConfirmation includes name and OTP', async () => {
        await sendRegistrationConfirmation('user@example.com', { name: 'Ana', otp: '111222' });

        const call = sendMail.mock.calls[0][0];
        expect(call.subject).toMatch(/Confirma tu correo/);
        expect(call.html).toContain('Ana');
        expect(call.html).toContain('111222');
        expect(call.text).toContain('111222');
    });

    it('every email attaches the logo and sets the correct From name', async () => {
        await sendEmail('user@example.com', '000000');

        const call = sendMail.mock.calls[0][0];
        expect(call.from).toContain('SMARTUR');
        expect(call.attachments).toHaveLength(1);
        expect(call.attachments[0].cid).toBe('smartur-logo');
    });
});
