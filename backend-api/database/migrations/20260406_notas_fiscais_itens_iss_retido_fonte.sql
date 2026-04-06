-- Indica se o ISS do item é retido na fonte (ex.: tpRetISSQN da NFS-e nacional, IssRetido ABRASF).
ALTER TABLE notas_fiscais_itens
  ADD COLUMN IF NOT EXISTS iss_retido_fonte BOOLEAN;

COMMENT ON COLUMN notas_fiscais_itens.iss_retido_fonte IS
  'ISS retido na fonte: true=sim, false=não, NULL=não informado (ex.: XML sem tpRetISSQN / vTotalRet).';
