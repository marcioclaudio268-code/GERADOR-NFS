# NFSE MVP - Mapa de Campos

## 1. Objetivo do documento
Mapear, de forma conservadora, os campos visíveis nos screenshots do portal de emissao e no modelo da DANFSe, para servir como contrato de dados do MVP de NFS-e antes de qualquer implementacao de tela, banco, integracao ou PDF.

## 2. Critérios usados no mapeamento
- Entrei no MVP apenas com campos que aparecem no material ou que sao diretamente necessarios para reconstruir a previa da nota.
- Marquei `aparece_na_previa` como `sim` quando o campo precisa ser conferido pelo cliente na previa ou faz parte do documento final visivel.
- Marquei `cliente_precisa_validar` como `sim` quando a alteracao do campo muda o conteudo fiscal, o destinatario, o servico, o valor ou a tributacao.
- Usei `avancado` para blocos e campos de excecao, retencoes raras, regimes especiais e casos de nao incidencia.
- Registrei como `pendente` tudo o que nao ficou claro apenas pelos screenshots, sem assumir regra de prefeitura ou regra fiscal nao visivel.
- Quando um mesmo dado aparece em mais de um bloco, mantive um unico campo canonico e registrei a repeticao na observacao.

## 3. Tabela mestre de campos
| campo | label_original | bloco | origem | obrigatorio_mvp | aparece_na_previa | cliente_precisa_validar | observacao_regra |
|---|---|---|---|---|---|---|---|
| chave_acesso_nfse | Chave de acesso da NFS-e | Campos finais exibidos na DANFSe | automatico | depende | depende | nao | Gerada pelo emissor; na previa pode ainda nao existir antes da autorizacao. |
| numero_nfse | Nº da NFS-e | Campos finais exibidos na DANFSe | automatico | depende | depende | nao | Identificador oficial; pode ser atribuido apenas depois da emissao. |
| serie_nfse | Série da NFS-e | Campos finais exibidos na DANFSe | automatico | depende | depende | nao | Dado tecnico do documento; regra de disponibilidade na previa nao ficou fechada. |
| data_hora_emissao_nfse | Data e Hora de emissão da NFS-e | Campos finais exibidos na DANFSe | automatico | depende | depende | nao | Timestamp do documento; na previa pode ficar pendente. |
| data_hora_emissao_dps | Data e Hora de emissão da DPS | Campos finais exibidos na DANFSe | automatico | depende | depende | nao | Visivel no modelo; o material nao fechou a regra de origem da DPS. |
| prestador_razao_social | Nome/Razão Social | Emitente da NFS-e | automatico | sim | sim | nao | Dado do emitente; aparece no bloco do prestador no DANFSe. |
| prestador_cnpj_cpf | CNPJ/CPF | Emitente da NFS-e | automatico | sim | sim | nao | Dado cadastral do emitente. |
| prestador_inscricao_municipal | Inscrição Municipal | Emitente da NFS-e | automatico | sim | sim | nao | Dado cadastral do emitente. |
| prestador_email | E-mail | Emitente da NFS-e | automatico | depende | sim | nao | Campo de contato; no material esta pequeno e pode variar por layout. |
| prestador_telefone | Telefone | Emitente da NFS-e | automatico | depende | sim | nao | Campo de contato; pode nao aparecer em todos os layouts. |
| prestador_endereco | Endereço | Emitente da NFS-e | automatico | sim | sim | nao | Endereco consolidado do emitente; o screenshot nao deixou todos os subcampos legiveis. |
| prestador_municipio | Município | Emitente da NFS-e | automatico | sim | sim | nao | Dado cadastral do emitente. |
| prestador_uf | UF | Emitente da NFS-e | automatico | sim | sim | nao | Dado cadastral do emitente. |
| prestador_cep | CEP | Emitente da NFS-e | automatico | sim | sim | nao | Dado cadastral do emitente. |
| tomador_localizacao | Localização do Tomador | Dados do Tomador de Serviços | automatico | sim | nao | nao | Controle operacional para indicar se o tomador sera informado; nao e dado fiscal final. |
| tomador_razao_social | Nome/Razão Social | Dados do Tomador de Serviços | automatico | depende | sim | sim | Dado do cliente/tomador; deve ser conferido antes da emissao. |
| tomador_cnpj_cpf | CNPJ/CPF | Dados do Tomador de Serviços | automatico | depende | sim | sim | Dado do cliente/tomador; pode ser ausente em alguns cenarios, por isso fica como depende. |
| tomador_inscricao_municipal | Inscrição Municipal | Dados do Tomador de Serviços | automatico | depende | sim | depende | Pode nao existir para todo tomador; manter como condicional. |
| tomador_email | E-mail | Dados do Tomador de Serviços | automatico | nao | sim | depende | Campo de contato, util para conferencia, mas nao e sempre obrigatorio. |
| tomador_telefone | Telefone | Dados do Tomador de Serviços | automatico | nao | sim | depende | Campo de contato, util para conferencia, mas nao e sempre obrigatorio. |
| tomador_endereco | Endereço | Dados do Tomador de Serviços | automatico | depende | sim | sim | Endereco consolidado do tomador no modelo final. |
| tomador_municipio | Município | Dados do Tomador de Serviços | automatico | depende | sim | sim | Dado de conferencia do destinatario. |
| tomador_uf | UF | Dados do Tomador de Serviços | automatico | depende | sim | sim | Dado de conferencia do destinatario. |
| tomador_cep | CEP | Dados do Tomador de Serviços | automatico | depende | sim | sim | Dado de conferencia do destinatario. |
| intermediario_localizacao | Localização Intermediário | Dados do Intermediário | automatico | depende | depende | nao | Controle operacional; o bloco de intermediario e excecao de uso. |
| intermediario_razao_social | Nome/Razão Social | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_cnpj_cpf | CNPJ/CPF | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_inscricao_municipal | Inscrição Municipal | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_email | E-mail | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_telefone | Telefone | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_endereco | Endereço | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_municipio | Município | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_uf | UF | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| intermediario_cep | CEP | Dados do Intermediário | avancado | depende | depende | depende | Somente quando houver intermediario. |
| numero_rps | Número da RPS | Dados do Recibo Provisório de Serviço (RPS) / Declaração de Prestação de Serviço (DPS) | automatico | depende | depende | nao | Dado tecnico do fluxo de origem; o material nao mostrou campo de DPS separado. |
| data_emissao_rps | Data Emissão RPS | Dados do Recibo Provisório de Serviço (RPS) / Declaração de Prestação de Serviço (DPS) | automatico | depende | depende | nao | Dado tecnico do fluxo de origem. |
| serie_rps | Série RPS | Dados do Recibo Provisório de Serviço (RPS) / Declaração de Prestação de Serviço (DPS) | automatico | depende | depende | nao | Dado tecnico do fluxo de origem. |
| servicos_prestados_codigo | Serviços Prestados | Dados da NFS-e | manual | sim | sim | sim | No screenshot aparece como opcao municipal, por exemplo `040301 Hospitais e congêneres.` |
| codigo_nbs | Código NBS | Dados da NFS-e | avancado | depende | depende | nao | Campo tecnico sem regra fiscal explicita no material. |
| data_emissao | Data Emissão | Dados da NFS-e | automatico | sim | sim | depende | No portal esta preenchida; a regra de retroacao nao ficou fechada. |
| competencia_mes | Competência | Dados da NFS-e | automatico | sim | sim | sim | No portal o mes aparece separado do ano. |
| competencia_ano | Competência | Dados da NFS-e | automatico | sim | sim | sim | No portal o ano aparece separado do mes. |
| observacoes | Observações | Dados da NFS-e | manual | nao | sim | sim | Campo livre do portal; deve entrar na previa quando houver texto. |
| situacao_tributaria | Situação Tributária | Tributação Federal / Retenções na Fonte Pelo Tomador | avancado | depende | depende | depende | Campo de enquadramento com regra nao fechada no recorte. |
| pis_cofins_csll_situacao | PIS/COFINS/CSLL | Tributação Federal / Retenções na Fonte Pelo Tomador | avancado | depende | depende | depende | Campo de enquadramento com regra nao fechada no recorte. |
| irrf_valor_imposto | IRRF - Valor do imposto | Tributação Federal / Retenções na Fonte Pelo Tomador | manual | depende | depende | depende | Valor de retencao informado no bloco do tomador; regra de calculo nao ficou explicita. |
| contribuicoes_sociais_retidas | Contribuições Sociais - Retidas | Tributação Federal / Retenções na Fonte Pelo Tomador | manual | depende | depende | depende | Campo de retencao federal informado no bloco do tomador. |
| inss_cp_imposto_retido | INSS/CP - Imposto Retido | Tributação Federal / Retenções na Fonte Pelo Tomador | manual | depende | depende | depende | Campo de retencao federal informado no bloco do tomador. |
| outros_impostos | Outros Impostos | Tributação Federal / Retenções na Fonte Pelo Tomador | manual | nao | depende | depende | Campo complementar de retencao; uso excepcional. |
| iss_valor_imposto_retido | ISS - Valor do imposto | Tributação Federal / Retenções na Fonte Pelo Tomador | calculado | depende | depende | nao | Valor de ISS retido na fonte; diferente do ISSQN calculado no bloco municipal. |
| issqn_tributacao_tipo | Tributação do ISSQN | Tributação Municipal | avancado | sim | sim | depende | Campo de enquadramento municipal; regra de uso precisa confirmacao. |
| regime_especial_issqn | Regime Especial | Tributação Municipal | avancado | depende | depende | depende | Uso excepcional. |
| iss_retido | Imposto Retido | Tributação Municipal | avancado | depende | depende | depende | Uso excepcional; depende da regra municipal. |
| iss_exigibilidade_suspensa | A exigibilidade do recolhimento do ISSQN devido nesta operação está suspensa? | Tributação Municipal | avancado | depende | depende | depende | Caso especial; nao assumir regra sem validacao. |
| iss_retencao_tomador_intermediario | Há retenção do ISSQN pelo Tomador ou pelo Intermediário? | Tributação Municipal | avancado | depende | depende | depende | Caso especial; pode mudar o responsavel pelo recolhimento. |
| beneficio_municipal | Este serviço prestado está amparado por algum benefício municipal? | Tributação Municipal | avancado | depende | depende | depende | Caso especial; depende de enquadramento local. |
| issqn_aliquota | Alíquota | Tributação Municipal | automatico | depende | sim | sim | Pode vir por padrao do cliente ou configuracao da operacao; confirmar se difere de Alíquota Aplicada. |
| issqn_caso_imunidade_exportacao_nao_incidencia | O serviço prestado é um caso de: imunidade, exportação de serviço ou não incidência do ISSQN? | Tributação ISSQN | avancado | depende | depende | depende | Campo de excecao; o material nao fechou a lista de opcoes e a regra de uso. |
| pais_prestacao | País | Local da Prestação do serviço | automatico | depende | sim | depende | Campo de busca; o material nao fechou a lista de valores. |
| municipio_prestacao | Município de Prestação | Local da Prestação do serviço | automatico | sim | sim | sim | Campo critico de local de incidencia da prestacao. |
| uf_prestacao | UF | Local da Prestação do serviço | automatico | depende | sim | nao | Dado derivado do municipio de prestacao. |
| municipio_incidencia | Município Incidência | Local da Prestação do serviço | automatico | sim | sim | nao | No screenshot aparece como `Bauru - SP`; parece derivado da regiao de incidencia. |
| local_servico | Local do Serviço | Local da Prestação do serviço | automatico | sim | sim | nao | Campo codificado; parece derivado do municipio de incidencia. |
| descricao_servico | Descrição | Descrição do Serviço | manual | sim | sim | sim | Texto livre que o cliente precisa ler e aprovar. |
| valor_servico_prestado | Valor | Descrição do Serviço | manual | sim | sim | sim | Mesmo valor aparece no resumo como Serviço Prestado. |
| desconto_incondicionado | Desc. Incondicionado | Valores do Serviço Prestado | manual | depende | sim | sim | Valor que tambem reaparece no resumo da NFS-e. |
| desconto_condicionado | Desc. Condicionado | Valores do Serviço Prestado | manual | depende | sim | sim | Valor que tambem reaparece no resumo da NFS-e. |
| valor_deducoes | Valor Deduções | Valores do Serviço Prestado | manual | depende | sim | sim | Alimenta o resumo `Deduções ou Retenções da BC`. |
| deducoes_ou_retencoes_da_base_calculo | Deduções ou Retenções da BC | Valores da NFS-e | calculado | depende | sim | sim | Resumo calculado a partir dos valores de servico e deducoes. |
| base_calculo | Base de Cálculo | Valores da NFS-e | calculado | sim | sim | sim | Mesma base aparece tambem como `BC ISSQN` no bloco municipal. |
| aliquota_aplicada | Alíquota Aplicada | Valores da NFS-e | calculado | sim | sim | sim | Pode coincidir com a aliquota informada, mas a regra exata nao ficou fechada. |
| issqn | ISSQN | Valores da NFS-e | calculado | sim | sim | sim | Valor final do ISSQN no resumo; o bloco municipal mostra o mesmo valor como `Valor ISSQN`. |
| pis_debito_apuracao_propria | PIS - Débito Apuração Própria | Tributação federal | calculado | depende | sim | depende | Campo de resumo federal; a regra de apuracao nao ficou visivel. |
| cofins_debito_apuracao_propria | COFINS - Débito Apuração Própria | Tributação federal | calculado | depende | sim | depende | Campo de resumo federal; a regra de apuracao nao ficou visivel. |
| irrf_retido_na_fonte | Imposto de Renda Retido na Fonte (IRRF) | Tributação federal | calculado | depende | sim | depende | Campo de resumo federal; a regra de apuracao nao ficou visivel. |
| valor_total_nfse | Valor Total da NFS-e | Campos finais exibidos na DANFSe | calculado | depende | depende | depende | Pendente: no recorte o valor mais legivel foi `Valor Líquido da NFS-e`; confirmar se existe total bruto separado. |
| valor_liquido_nfse | Valor Líquido da NFS-e | Campos finais exibidos na DANFSe | calculado | sim | sim | sim | Valor final a ser conferido pelo cliente. |
| total_tributos_federais | Federais | Total Tributos / Fiscais | calculado | nao | sim | nao | Campo de transparencia fiscal do DANFSe; o recorte nao permitiu ler os valores com precisao. |
| total_tributos_estaduais | Estaduais | Total Tributos / Fiscais | calculado | nao | sim | nao | Campo de transparencia fiscal do DANFSe; o recorte nao permitiu ler os valores com precisao. |
| total_tributos_municipais | Municipais | Total Tributos / Fiscais | calculado | nao | sim | nao | Campo de transparencia fiscal do DANFSe; o recorte nao permitiu ler os valores com precisao. |
| informacoes_complementares | Informações Complementares | Campos finais exibidos na DANFSe | manual | nao | sim | sim | No screenshot aparece uma nota curta; manter como texto livre conferivel. |

## 4. Separação operacional do MVP
### 4.1 Campos preenchidos sempre pelo operador
- `servicos_prestados_codigo`
- `descricao_servico`
- `valor_servico_prestado`
- `municipio_prestacao`
- `local_servico`
- `data_emissao`
- `observacoes`
- `issqn_tributacao_tipo`
- `issqn_aliquota` quando nao vier preenchida por padrao
- `valor_deducoes`
- `desconto_incondicionado`
- `desconto_condicionado`
- `irrf_valor_imposto`
- `contribuicoes_sociais_retidas`
- `inss_cp_imposto_retido`
- `outros_impostos`
- `informacoes_complementares` quando houver texto

### 4.2 Campos que podem vir por padrão do cliente
- `tomador_razao_social`
- `tomador_cnpj_cpf`
- `tomador_inscricao_municipal`
- `tomador_email`
- `tomador_telefone`
- `tomador_endereco`
- `tomador_municipio`
- `tomador_uf`
- `tomador_cep`
- `prestador_razao_social`
- `prestador_cnpj_cpf`
- `prestador_inscricao_municipal`
- `prestador_email`
- `prestador_telefone`
- `prestador_endereco`
- `prestador_municipio`
- `prestador_uf`
- `prestador_cep`
- `numero_rps`
- `data_emissao_rps`
- `serie_rps`
- `competencia_mes`
- `competencia_ano`
- `municipio_incidencia`
- `pais_prestacao`
- `uf_prestacao`

### 4.3 Campos calculados pelo sistema
- `iss_valor_imposto_retido`
- `deducoes_ou_retencoes_da_base_calculo`
- `base_calculo`
- `aliquota_aplicada`
- `issqn`
- `pis_debito_apuracao_propria`
- `cofins_debito_apuracao_propria`
- `irrf_retido_na_fonte`
- `valor_liquido_nfse`
- `valor_total_nfse` se o modelo final separar total bruto e liquido
- `total_tributos_federais`
- `total_tributos_estaduais`
- `total_tributos_municipais`

### 4.4 Campos avançados / excepcionais
- `intermediario_localizacao`
- `intermediario_razao_social`
- `intermediario_cnpj_cpf`
- `intermediario_inscricao_municipal`
- `intermediario_email`
- `intermediario_telefone`
- `intermediario_endereco`
- `intermediario_municipio`
- `intermediario_uf`
- `intermediario_cep`
- `codigo_nbs`
- `situacao_tributaria`
- `pis_cofins_csll_situacao`
- `regime_especial_issqn`
- `iss_retido`
- `iss_exigibilidade_suspensa`
- `iss_retencao_tomador_intermediario`
- `beneficio_municipal`
- `issqn_caso_imunidade_exportacao_nao_incidencia`

## 5. Campos mínimos da prévia
- `tomador_razao_social`
- `tomador_cnpj_cpf`
- `tomador_endereco`
- `tomador_municipio`
- `tomador_uf`
- `tomador_cep`
- `servicos_prestados_codigo`
- `descricao_servico`
- `municipio_prestacao`
- `local_servico`
- `competencia_mes`
- `competencia_ano`
- `data_emissao`
- `valor_servico_prestado`
- `desconto_incondicionado`
- `desconto_condicionado`
- `valor_deducoes`
- `base_calculo`
- `aliquota_aplicada`
- `issqn`
- `valor_liquido_nfse`
- `observacoes`
- `informacoes_complementares`
- `situacao_tributaria` quando houver retencao ou cenarios especiais
- `pis_cofins_csll_situacao` quando houver retencao ou cenarios especiais
- `irrf_valor_imposto`, `contribuicoes_sociais_retidas`, `inss_cp_imposto_retido` e `outros_impostos` quando aplicaveis

## 6. Campos sensíveis para nova aprovação
- `tomador_razao_social`, `tomador_cnpj_cpf`, `tomador_inscricao_municipal`, `tomador_endereco`, `tomador_municipio`, `tomador_uf`, `tomador_cep`
- `intermediario_razao_social`, `intermediario_cnpj_cpf`, `intermediario_inscricao_municipal`, `intermediario_endereco`, `intermediario_municipio`, `intermediario_uf`, `intermediario_cep` quando o intermediario estiver em uso
- `servicos_prestados_codigo`
- `descricao_servico`
- `valor_servico_prestado`
- `desconto_incondicionado`
- `desconto_condicionado`
- `valor_deducoes`
- `municipio_prestacao`
- `local_servico`
- `data_emissao`
- `competencia_mes`
- `competencia_ano`
- `issqn_tributacao_tipo`
- `issqn_aliquota`
- `situacao_tributaria`
- `pis_cofins_csll_situacao`
- `irrf_valor_imposto`
- `contribuicoes_sociais_retidas`
- `inss_cp_imposto_retido`
- `outros_impostos`
- `regime_especial_issqn`
- `iss_retido`
- `iss_exigibilidade_suspensa`
- `iss_retencao_tomador_intermediario`
- `beneficio_municipal`
- `issqn_caso_imunidade_exportacao_nao_incidencia`
- `observacoes`
- `informacoes_complementares`

## 7. Pendências e ambiguidades
- O recorte da DANFSe mostra chave de acesso, numero, serie e datas, mas nao ficou claro se tudo isso existe antes da autorizacao oficial ou apenas depois da emissao.
- Nao ficou fechado se `tomador_localizacao` e `intermediario_localizacao` sao apenas controles operacionais ou se devem ser tratados como dado persistido de negocio.
- O material nao esclarece a regra fiscal do `codigo_nbs` nem se ele e obrigatorio para este municipio.
- Nao ficou claro se `issqn_aliquota` e `aliquota_aplicada` podem divergir em algum cenario ou se sao sempre o mesmo percentual.
- Nao ficou claro se `valor_total_nfse` e um campo distinto de `valor_liquido_nfse` no modelo final.
- Os totais de `Total Tributos / Fiscais` aparecem no modelo, mas o recorte nao permitiu ler com precisao o valor e a formula.
- A relacao exata entre `ISS - Valor do imposto`, `Valor ISSQN` e `ISSQN` precisa de validacao posterior.
- O bloco de emitente aparece no modelo, mas alguns subcampos de contato ficaram pequenos demais para confirmar com 100 por cento de certeza.

## 8. Proposta inicial de shape do rascunho_nfse
```yaml
rascunho_nfse:
  identificacao:
    chave_acesso_nfse: null
    numero_nfse: null
    serie_nfse: null
    data_hora_emissao_nfse: null
    data_hora_emissao_dps: null
  prestador:
    razao_social: null
    cnpj_cpf: null
    inscricao_municipal: null
    email: null
    telefone: null
    endereco: null
    municipio: null
    uf: null
    cep: null
  tomador:
    localizacao: null
    razao_social: null
    cnpj_cpf: null
    inscricao_municipal: null
    email: null
    telefone: null
    endereco: null
    municipio: null
    uf: null
    cep: null
  intermediario:
    localizacao: null
    razao_social: null
    cnpj_cpf: null
    inscricao_municipal: null
    email: null
    telefone: null
    endereco: null
    municipio: null
    uf: null
    cep: null
  rps_dps:
    numero_rps: null
    data_emissao_rps: null
    serie_rps: null
  servico:
    servicos_prestados_codigo: null
    codigo_nbs: null
    descricao_servico: null
    data_emissao: null
    competencia:
      mes: null
      ano: null
    observacoes: null
  local_prestacao:
    pais: null
    municipio_prestacao: null
    uf: null
    municipio_incidencia: null
    local_servico: null
  tributacao_municipal:
    issqn_tributacao_tipo: null
    regime_especial_issqn: null
    iss_retido: null
    iss_exigibilidade_suspensa: null
    iss_retencao_tomador_intermediario: null
    beneficio_municipal: null
    issqn_aliquota: null
  tributacao_issqn:
    caso_imunidade_exportacao_nao_incidencia: null
  tributacao_federal_retencoes_tomador:
    situacao_tributaria: null
    pis_cofins_csll_situacao: null
    irrf_valor_imposto: null
    contribuicoes_sociais_retidas: null
    inss_cp_imposto_retido: null
    outros_impostos: null
    iss_valor_imposto_retido: null
  valores:
    valor_servico_prestado: null
    desconto_incondicionado: null
    desconto_condicionado: null
    valor_deducoes: null
    deducoes_ou_retencoes_da_base_calculo: null
    base_calculo: null
    aliquota_aplicada: null
    issqn: null
    pis_debito_apuracao_propria: null
    cofins_debito_apuracao_propria: null
    irrf_retido_na_fonte: null
    valor_liquido_nfse: null
    valor_total_nfse: null
  totais_tributarios:
    federais: null
    estaduais: null
    municipais: null
  informacoes_complementares:
    texto: null
  aprovacao_cliente:
    status: rascunho
    aprovado_em: null
    aprovado_por: null
```
