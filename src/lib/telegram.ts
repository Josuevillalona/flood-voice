const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
    })
});

if (!response.ok) {
    const error = await response.json();
    console.error('Telegram API error:', error);
    return null;
}

return response.json();
export async function sendFloodAlert(chatId: number | string, sensorName: string, depth: number) {
    const message = `⚠️ <b>FLOOD RISK DETECTED</b>\n\n` +
        `Sensor: <b>${sensorName}</b>\n` +
        `Depth: <b>${depth.toFixed(2)} inches</b>\n\n` +
        `Review your pod and consider triggering emergency check-ins.\n\n` +
        `Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;

    return sendTelegramMessage(chatId, message);
}
