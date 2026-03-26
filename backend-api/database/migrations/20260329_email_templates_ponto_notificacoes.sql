-- Templates de e-mail usados em notificacoes-ponto.js (substituição {{variavel}})
-- ON CONFLICT: não sobrescreve personalizações já salvas no painel

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_responsavel',
  'Ponto — e-mail ao responsável',
  'Registro de ponto concluído — {{funcionario_nome}} — {{data_formatada}}',
  $html$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#333;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#2563eb;margin-top:0;">Registro de ponto concluído</h2>
<p>Um funcionário fechou o dia e aguarda sua assinatura.</p>
<p><strong>Funcionário:</strong> {{funcionario_nome}}<br/>
<strong>Cargo:</strong> {{funcionario_cargo}}<br/>
<strong>Obra:</strong> {{obra_nome}}</p>
<p><strong>Data:</strong> {{data_formatada}}</p>
<table cellpadding="8" style="border-collapse:collapse;width:100%;border:1px solid #ddd;font-size:14px;">
<tr><td style="border:1px solid #eee;">Entrada</td><td style="border:1px solid #eee;">{{entrada}}</td></tr>
<tr><td style="border:1px solid #eee;">Saída almoço</td><td style="border:1px solid #eee;">{{saida_almoco}}</td></tr>
<tr><td style="border:1px solid #eee;">Volta almoço</td><td style="border:1px solid #eee;">{{volta_almoco}}</td></tr>
<tr><td style="border:1px solid #eee;">Saída</td><td style="border:1px solid #eee;">{{saida}}</td></tr>
</table>
<p><strong>Horas trabalhadas:</strong> {{horas_trabalhadas}}h · <strong>Extras:</strong> {{horas_extras}}h</p>
<p><a href="{{link_assinar}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff!important;text-decoration:none;border-radius:6px;">Assinar agora</a></p>
<p style="font-size:12px;color:#888;">Sistema de Gerenciamento de Gruas</p>
</body></html>$html$,
  '["funcionario_nome","funcionario_cargo","obra_nome","data_formatada","entrada","saida_almoco","volta_almoco","saida","horas_trabalhadas","horas_extras","link_assinar"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_pendente_generica',
  'Ponto — pendências de aprovação na obra',
  'Existem pontos pendentes de aprovação — {{obra_nome}}',
  $html$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
<p>Olá, {{responsavel_nome}},</p>
<p>Existem registros de ponto pendentes de aprovação na obra <strong>{{obra_nome}}</strong>.</p>
<p><a href="{{link_aprovacoes}}">Acessar aprovações</a></p>
</body></html>$html$,
  '["responsavel_nome","obra_nome","link_aprovacoes"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_funcionario',
  'Ponto — assinado pelo responsável (funcionário)',
  'Ponto assinado pelo responsável — {{data_formatada}}',
  $html$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
<h2 style="color:#16a34a;margin-top:0;">Ponto assinado pelo responsável</h2>
<p>O responsável <strong>{{responsavel_nome}}</strong> assinou seu registro de <strong>{{data_formatada}}</strong>.</p>
<p>Horas trabalhadas: <strong>{{horas_trabalhadas}}h</strong> · Extras: <strong>{{horas_extras}}h</strong></p>
<p><a href="{{link_assinar}}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff!important;text-decoration:none;border-radius:6px;">Assinar no app</a></p>
</body></html>$html$,
  '["responsavel_nome","data_formatada","horas_trabalhadas","horas_extras","link_assinar"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_rejeicao',
  'Ponto — registro não aprovado',
  'Registro de ponto não aprovado — {{data_formatada}}',
  $html$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
<h2 style="color:#dc2626;margin-top:0;">Registro não aprovado</h2>
<p><strong>Responsável:</strong> {{responsavel_nome}}</p>
<p><strong>Motivo:</strong> {{comentario}}</p>
<p><strong>Data:</strong> {{data_formatada}}</p>
<table cellpadding="8" style="border-collapse:collapse;width:100%;border:1px solid #ddd;font-size:14px;">
<tr><td>Entrada</td><td>{{entrada}}</td></tr>
<tr><td>Saída almoço</td><td>{{saida_almoco}}</td></tr>
<tr><td>Volta almoço</td><td>{{volta_almoco}}</td></tr>
<tr><td>Saída</td><td>{{saida}}</td></tr>
</table>
<p>Horas: {{horas_trabalhadas}}h · Extras: {{horas_extras}}h</p>
<p><a href="{{link_corrigir}}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff!important;text-decoration:none;border-radius:6px;">Corrigir horas</a></p>
</body></html>$html$,
  '["responsavel_nome","comentario","data_formatada","entrada","saida_almoco","volta_almoco","saida","horas_trabalhadas","horas_extras","link_corrigir"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;
