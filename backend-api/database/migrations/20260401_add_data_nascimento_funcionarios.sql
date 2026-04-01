-- Coluna usada em syncProfileWithFuncionario (auth) e perfil; presente em schema.sql mas ausente em alguns bancos.
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

COMMENT ON COLUMN funcionarios.data_nascimento IS 'Data de nascimento do funcionário';
