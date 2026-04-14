-- Remove template do fluxo "apenas boletos" (opção descontinuada na medição).
DELETE FROM email_templates WHERE tipo = 'medicao_boletos_enviada';
