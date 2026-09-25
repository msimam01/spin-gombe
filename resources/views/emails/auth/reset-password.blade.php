{{--
    Branded password-reset email (HTML).

    Email-client-safe by construction: table layout, inline styles only,
    hex colours (the app's oklch design tokens do not resolve in mail
    clients), web-safe font stack and a plain fallback link. Palette mirrors
    resources/css/app.css: brand green #177C52 (--brand-600), gold accent
    #EAA950 (--gold-400), ink #141D19, muted #54615A, hairline #E4EAE7.
--}}
@php
    $fullName = 'Sustainable Power and Irrigation for Nigeria Project';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your SPIN Gombe password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F5; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141D19;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F6F5; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; border: 1px solid #E4EAE7;">
                    <!-- Brand bar -->
                    <tr>
                        <td style="height: 6px; background-color: #177C52; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>
                    <!-- Identity -->
                    <tr>
                        <td style="padding: 32px 40px 0 40px;">
                            <p style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #177C52;">SPIN Gombe State Project</p>
                            <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: #54615A;">{{ $fullName }}</p>
                            <div style="width: 48px; height: 3px; background-color: #EAA950; margin-top: 14px; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 28px 40px 8px 40px;">
                            <h1 style="margin: 0 0 16px 0; font-size: 22px; line-height: 1.3; font-weight: 600; color: #141D19;">Reset your password</h1>
                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #3C4642;">
                                We received a request to reset the password for the account associated with
                                this email address. Click the button below to choose a new password for the
                                SPIN administration area.
                            </p>
                        </td>
                    </tr>
                    <!-- Action button -->
                    <tr>
                        <td style="padding: 8px 40px 24px 40px;" align="left">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color: #177C52; border-radius: 6px;">
                                        <a href="{{ $url }}"
                                           style="display: inline-block; padding: 13px 28px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 6px;"
                                           target="_blank">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Fallback link -->
                    <tr>
                        <td style="padding: 0 40px 24px 40px;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.6; color: #54615A;">
                                If the button does not work, copy and paste this address into your browser:
                            </p>
                            <p style="margin: 0; font-size: 13px; line-height: 1.6; word-break: break-all; color: #177C52;">
                                {{ $url }}
                            </p>
                        </td>
                    </tr>
                    <!-- Expiry + security -->
                    <tr>
                        <td style="padding: 0 40px 28px 40px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F6F5; border-radius: 6px; border-left: 3px solid #EAA950;">
                                <tr>
                                    <td style="padding: 14px 18px;">
                                        <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.6; color: #3C4642;">
                                            <strong>This link expires in {{ $expireMinutes }} minutes</strong> and can be used only once.
                                        </p>
                                        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #3C4642;">
                                            <strong>Did not request a reset?</strong> You can safely ignore this
                                            email — your password will not change. If you keep receiving these
                                            messages, contact the website administrator.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 28px 40px; border-top: 1px solid #E4EAE7;">
                            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #54615A;">
                                {{ $fullName }} (SPIN) — Gombe State, Nigeria.<br>
                                This is an automated message from
                                <a href="mailto:spinprojectgombe@gmail.com" style="color: #177C52; text-decoration: none;">spinprojectgombe@gmail.com</a>.
                                Replies to this address are not monitored for support.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
