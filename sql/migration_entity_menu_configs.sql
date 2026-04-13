-- Entity별 메뉴 순서/카테고리 설정
CREATE TABLE IF NOT EXISTS amb_entity_menu_configs (
  emc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ent_id UUID NOT NULL,
  emc_menu_code VARCHAR(50) NOT NULL,
  emc_category VARCHAR(30) NOT NULL,
  emc_sort_order INT NOT NULL,
  emc_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  emc_updated_by UUID NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_entity_menu_config_ent_menu
  ON amb_entity_menu_configs (ent_id, emc_menu_code);

CREATE INDEX IF NOT EXISTS idx_entity_menu_config_ent_sort
  ON amb_entity_menu_configs (ent_id, emc_sort_order);
