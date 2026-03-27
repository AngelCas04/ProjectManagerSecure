package com.projectmanager.platform.service;

import com.projectmanager.platform.config.RecoveryProperties;
import com.projectmanager.platform.domain.AppUser;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class RecoveryEmailService {

    private static final Logger log = LoggerFactory.getLogger(RecoveryEmailService.class);

    private final JavaMailSender javaMailSender;
    private final MailProperties mailProperties;
    private final RecoveryProperties recoveryProperties;

    public RecoveryEmailService(JavaMailSender javaMailSender, MailProperties mailProperties, RecoveryProperties recoveryProperties) {
        this.javaMailSender = javaMailSender;
        this.mailProperties = mailProperties;
        this.recoveryProperties = recoveryProperties;
    }

    public void sendPasswordResetLink(AppUser user, String rawToken) {
        String resetUrl = buildResetUrl(rawToken);

        if (!StringUtils.hasText(mailProperties.getHost())) {
            log.info("Password recovery link for {}: {}", user.getEmail(), resetUrl);
            return;
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(formatFromAddress());
            helper.setTo(user.getEmail());
            helper.setSubject("Recupera tu acceso a Project Manager");
            helper.setText(buildPlainTextBody(user, resetUrl), buildHtmlBody(user, resetUrl));
            javaMailSender.send(message);
        } catch (Exception ex) {
            log.error("No pudimos enviar el correo de recuperacion a {}. Enlace generado: {}", user.getEmail(), resetUrl, ex);
        }
    }

    private String formatFromAddress() {
        if (StringUtils.hasText(recoveryProperties.getSenderName())) {
            return recoveryProperties.getSenderName() + " <" + recoveryProperties.getSenderAddress() + ">";
        }
        return recoveryProperties.getSenderAddress();
    }

    private String buildResetUrl(String rawToken) {
        String baseUrl = recoveryProperties.getFrontendBaseUrl().replaceAll("/+$", "");
        String path = recoveryProperties.getResetPath().startsWith("/") ? recoveryProperties.getResetPath() : "/" + recoveryProperties.getResetPath();
        return baseUrl + path + "?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }

    private String buildPlainTextBody(AppUser user, String resetUrl) {
        return ""
            + "Hola " + user.getName() + ",\n\n"
            + "Recibimos una solicitud para recuperar tu acceso a Project Manager.\n"
            + "Abre este enlace para continuar:\n\n"
            + resetUrl + "\n\n"
            + "Este enlace estara disponible por tiempo limitado para proteger tu cuenta.\n\n"
            + "Si no fuiste tu, ignora este mensaje.\n";
    }

    private String buildHtmlBody(AppUser user, String resetUrl) {
        String safeName = HtmlUtils.htmlEscape(user.getName());
        String safeUrl = HtmlUtils.htmlEscape(resetUrl);
        String safeSenderName = HtmlUtils.htmlEscape(recoveryProperties.getSenderName());

        return """
            <!doctype html>
            <html lang="es">
              <body style="margin:0;padding:0;background:#f5efe5;font-family:Georgia,'Times New Roman',serif;color:#24180d;">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
                  Recupera tu acceso a Project Manager y vuelve a tu espacio de trabajo.
                </div>
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f5efe5;padding:32px 16px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffaf3;border:1px solid #eadcc9;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(94,56,18,0.12);">
                        <tr>
                          <td style="padding:0;">
                            <div style="background:linear-gradient(135deg,#201611 0%%,#5d300f 56%%,#a84f28 100%%);padding:40px 40px 32px;color:#fff5e6;">
                              <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#f6c8a4;margin-bottom:18px;">
                                Recuperacion de cuenta
                              </div>
                              <div style="font-size:36px;line-height:1.08;font-weight:700;max-width:460px;">
                                Vuelve a entrar a tu espacio de trabajo
                              </div>
                              <div style="margin-top:16px;font-size:16px;line-height:1.7;color:#f8dec8;max-width:470px;">
                                Protegimos tu solicitud y ya preparamos un acceso temporal para que cambies tu contrasena con tranquilidad.
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 40px 20px;">
                            <div style="font-size:15px;line-height:1.8;color:#5c4736;">
                              Hola <strong style="color:#24180d;">%s</strong>, recibimos una solicitud para recuperar tu cuenta en <strong style="color:#24180d;">%s</strong>.
                            </div>
                            <div style="margin-top:24px;padding:24px;border:1px solid #eadcc9;border-radius:22px;background:#fff;">
                              <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#9c5a2f;margin-bottom:10px;">
                                Paso siguiente
                              </div>
                              <div style="font-size:24px;line-height:1.3;color:#24180d;font-weight:700;margin-bottom:12px;">
                                Crea una nueva contrasena
                              </div>
                              <div style="font-size:15px;line-height:1.75;color:#6d5643;">
                                Usa el siguiente boton para abrir la pantalla segura de restablecimiento. El enlace estara disponible por tiempo limitado.
                              </div>
                              <div style="margin-top:28px;">
                                <a href="%s" style="display:inline-block;background:#b5552c;color:#fffaf3;text-decoration:none;padding:16px 26px;border-radius:999px;font-size:16px;font-weight:700;">
                                  Recuperar mi acceso
                                </a>
                              </div>
                            </div>
                            <div style="margin-top:22px;padding:18px 20px;background:#f8f1e5;border-radius:18px;font-size:14px;line-height:1.7;color:#6b594a;">
                              Si el boton no abre directamente, copia y pega este enlace en tu navegador:<br />
                              <a href="%s" style="color:#9c4e28;word-break:break-all;">%s</a>
                            </div>
                            <div style="margin-top:28px;font-size:14px;line-height:1.75;color:#7a6453;">
                              Si no solicitaste este cambio, puedes ignorar este correo. Tu cuenta seguira protegida y no se hara ninguna modificacion sin tu confirmacion.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 40px 34px;">
                            <div style="height:1px;background:#eadcc9;margin-bottom:22px;"></div>
                            <div style="font-size:12px;line-height:1.8;letter-spacing:0.12em;text-transform:uppercase;color:#9b775d;">
                              %s
                            </div>
                            <div style="font-size:13px;line-height:1.7;color:#8b7460;margin-top:6px;">
                              Coordinacion de proyectos, equipos y entregas en un solo lugar.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """.formatted(safeName, safeSenderName, safeUrl, safeUrl, safeUrl, safeSenderName);
    }
}
