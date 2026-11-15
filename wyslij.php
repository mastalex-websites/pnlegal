<?php
/**
 * Obsługa formularza kontaktowego — do uruchomienia na hostingu PHP (Seohost).
 * Na here.now (prototyp statyczny) ten plik nie działa; skrypt main.js wraca wtedy do mailto.
 * Przed wdrożeniem: ustawić $to i sprawdzić, czy hosting zezwala na mail() (u Seohost zwykle tak;
 * w razie problemów przełączyć na SMTP konta piotr.nowakowski@pnlegal.pl).
 */
header('Content-Type: application/json; charset=utf-8');

$to = 'piotr.nowakowski@pnlegal.pl';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok' => false]); exit; }
if (!empty($_POST['firma_www'])) { echo json_encode(['ok' => true]); exit; } // honeypot — bot, udajemy sukces

$imie      = trim(strip_tags($_POST['imie'] ?? ''));
$email     = trim($_POST['email'] ?? '');
$telefon   = trim(strip_tags($_POST['telefon'] ?? ''));
$temat     = trim(strip_tags($_POST['temat'] ?? 'kontakt'));
$wiadomosc = trim(strip_tags($_POST['wiadomosc'] ?? ''));
$zgoda     = !empty($_POST['zgoda']);

if ($imie === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $wiadomosc === '' || !$zgoda) {
  http_response_code(422); echo json_encode(['ok' => false, 'error' => 'brak-danych']); exit;
}

$subject = '=?UTF-8?B?' . base64_encode('Zapytanie ze strony — ' . $temat) . '?=';
$body = "Imię i nazwisko: $imie\nE-mail: $email\nTelefon: " . ($telefon ?: '—') . "\nKim jestem: $temat\n\n$wiadomosc\n\n— wysłane z formularza na pnlegal.pl, " . date('Y-m-d H:i');
$headers = "From: Formularz pnlegal.pl <formularz@pnlegal.pl>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, $subject, $body, $headers);
echo json_encode(['ok' => (bool)$sent]);
