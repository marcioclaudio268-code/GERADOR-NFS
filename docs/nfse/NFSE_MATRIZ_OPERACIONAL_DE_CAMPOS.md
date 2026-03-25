# NFSE MVP - Matriz Operacional de Campos

## 1. Objetivo do documento
Consolidar, em uma unica matriz operacional, os campos do MVP de NFSe que impactam formulario, previa, validacao por etapa, renderizacao, workflow/status e emissao. A leitura segue o Prisma e o Zod ja implementados, mas separa explicitamente o que e entrada do rascunho, o que e calculado na previa e o que so existe pos-autorizacao.

## 2. Como ler a matriz
- `sim` = obrigatorio ou presente naquela etapa operacional.
- `nao` = nao entra ou nao se aplica naquela etapa.
- `depende` = condicional, opcional, ou ainda nao fechado no material.
- `PRE_VALIDACAO` = validacao do rascunho antes de gerar a previa.
- `AGUARDANDO_APROVACAO_CLIENTE` = previa gerada e aguardando aceite.
- `APROVADO_CLIENTE` = cliente aprovou e o fluxo segue para emissao.
- `EMITIDO` = documento oficial autorizado.
- Quando um valor continua acessivel por relacao, mas nao faz parte do payload oficial daquela etapa, a matriz usa `depende` e registra isso nas observacoes.
- Metadados tecnicos de persistencia (`id`, `createdAt`, `updatedAt`, `rascunhoId`, `previaId`) foram omitidos por nao orientarem formulario ou previa.

## 3. Matriz operacional

### 3.1 Controle operacional e workflow
Campos de gestao interna do rascunho e da transicao de estados.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| controle operacional | status | controle operacional | nao | nao | nao | nao | nao | sim | sim | sim | sim | sim | Estado interno do rascunho; a aplicação altera o valor no workflow. |
| controle operacional | tomadorLocalizacao | controle operacional | sim | sim | nao | nao | nao | depende | depende | depende | depende | depende | Seletor operacional do portal; nao e dado fiscal. |
| controle operacional | intermediarioLocalizacao | controle operacional | sim | sim | nao | nao | nao | depende | depende | depende | depende | depende | Seletor operacional de excecao; manter opcional no MVP. |

### 3.2 Emitente / prestador
Origem normal: cadastro do cliente ou payload ja hidratado antes da validacao.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| emitente/prestador | prestadorRazaoSocial | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Nome/racao social do emitente; normalmente vem do cadastro do cliente. |
| emitente/prestador | prestadorCnpjCpf | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Documento do emitente sem mascara; normalizacao minima. |
| emitente/prestador | prestadorInscricaoMunicipal | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Inscricao municipal do emitente; valor cadastral. |
| emitente/prestador | prestadorEmail | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de contato; opcional no MVP. |
| emitente/prestador | prestadorTelefone | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de contato; opcional no MVP. |
| emitente/prestador | prestadorEndereco | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Endereco consolidado do emitente. |
| emitente/prestador | prestadorMunicipio | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Municipio do emitente. |
| emitente/prestador | prestadorUf | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | UF do emitente; normalizacao simples para 2 letras. |
| emitente/prestador | prestadorCep | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | CEP do emitente sem mascara. |

### 3.3 Tomador
Bloco opcional; so entra quando o tomador for informado no fluxo.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tomador | tomadorRazaoSocial | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Obrigatorio apenas quando o tomador estiver em uso. |
| tomador | tomadorCnpjCpf | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Documento do tomador; sem validacao fiscal pesada. |
| tomador | tomadorInscricaoMunicipal | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Pode nao existir para todo tomador. |
| tomador | tomadorEmail | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de contato conferencial. |
| tomador | tomadorTelefone | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de contato conferencial. |
| tomador | tomadorEndereco | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Endereco consolidado do tomador. |
| tomador | tomadorMunicipio | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Municipio do tomador; pode vir do cadastro do cliente. |
| tomador | tomadorUf | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | UF do tomador. |
| tomador | tomadorCep | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | CEP do tomador sem mascara. |

### 3.4 Intermediário
Bloco de excecao; manter opcional no MVP.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| intermediário | intermediarioRazaoSocial | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Somente quando houver intermediario. |
| intermediário | intermediarioCnpjCpf | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Documento do intermediario; uso excepcional. |
| intermediário | intermediarioInscricaoMunicipal | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo cadastral do intermediario. |
| intermediário | intermediarioEmail | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de contato; opcional. |
| intermediário | intermediarioTelefone | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de contato; opcional. |
| intermediário | intermediarioEndereco | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Endereco consolidado do intermediario. |
| intermediário | intermediarioMunicipio | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Municipio do intermediario. |
| intermediário | intermediarioUf | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | UF do intermediario. |
| intermediário | intermediarioCep | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | CEP do intermediario sem mascara. |

### 3.5 RPS / DPS
Origem tecnica do documento de origem; opcional no MVP e normalmente importada de outro fluxo.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RPS/DPS | numeroRps | controle operacional | sim | depende | depende | nao | nao | depende | depende | depende | depende | depende | Dado tecnico do fluxo de origem; manter opcional no MVP. |
| RPS/DPS | dataEmissaoRps | controle operacional | sim | depende | depende | nao | nao | depende | depende | depende | depende | depende | Data tecnica do RPS/DPS; regra de obrigatoriedade nao fechada. |
| RPS/DPS | serieRps | controle operacional | sim | depende | depende | nao | nao | depende | depende | depende | depende | depende | Serie tecnica do RPS/DPS. |

### 3.6 Serviço, tributação e local da prestação
Consolida os campos do servico, enquadramento tributario e local da prestacao. Onde o portal repete a informacao em mais de um bloco, a matriz preserva apenas o nome canonico.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| serviço / tributação base | servicosPrestadosCodigo | controle operacional | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Classificacao do servico; no portal aparece como select municipal. |
| serviço / tributação base | codigoNbs | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Opcional no MVP; regra fiscal do NBS nao foi fechada. |
| serviço / tributação base | dataEmissao | controle operacional | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Data operacional do rascunho; regra de retroacao nao foi fechada. |
| serviço / tributação base | competenciaMes | controle operacional | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Mes da competencia; no portal aparece separado do ano. |
| serviço / tributação base | competenciaAno | controle operacional | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Ano da competencia; no portal aparece separado do mes. |
| serviço / tributação base | situacaoTributaria | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de enquadramento; manter conservador no MVP. |
| serviço / tributação base | pisCofinsCsllSituacao | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de enquadramento federal; regra nao fechada. |
| serviço / tributação base | irrfValorImposto | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Retencao informada pelo operador; nao assumir calculo. |
| serviço / tributação base | contribuicoesSociaisRetidas | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de retencao federal; opcional. |
| serviço / tributação base | inssCpImpostoRetido | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de retencao federal; opcional. |
| serviço / tributação base | outrosImpostos | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo complementar de retencao; uso excepcional. |
| serviço / tributação base | issqnTributacaoTipo | controle operacional | sim | sim | sim | nao | nao | depende | depende | depende | depende | depende | Enquadramento municipal do ISSQN; regra local nao fechada. |
| serviço / tributação base | regimeEspecialIssqn | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Uso excepcional. |
| serviço / tributação base | issRetido | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Indicador municipal de retencao; depende do cenario. |
| serviço / tributação base | issExigibilidadeSuspensa | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Caso especial de suspensao; nao assumir regra. |
| serviço / tributação base | issRetencaoTomadorIntermediario | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Fluxo excepcional de retenção pelo tomador ou intermediario. |
| serviço / tributação base | beneficioMunicipal | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Excecao de beneficio municipal. |
| serviço / tributação base | issqnAliquota | controle operacional | sim | sim | sim | nao | nao | depende | depende | depende | depende | depende | Pode vir do cadastro do cliente; conferir com aliquota aplicada. |
| serviço / tributação base | issqnCasoImunidadeExportacaoNaoIncidencia | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de excecao; lista de opcoes ainda nao fechada. |
| local da prestação | paisPrestacao | controle operacional | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo de busca/seleção; regra de valores nao fechada. |
| local da prestação | municipioPrestacao | controle operacional | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Campo critico de incidencia da prestacao. |
| local da prestação | ufPrestacao | derivado/calculado | sim | depende | depende | nao | nao | depende | depende | depende | depende | depende | Normalmente derivado do municipio de prestacao. |
| local da prestação | municipioIncidencia | derivado/calculado | sim | depende | depende | nao | nao | depende | depende | depende | depende | depende | No portal costuma aparecer como municipio de incidencia. |
| local da prestação | localServico | derivado/calculado | sim | depende | sim | nao | nao | sim | sim | sim | sim | depende | Campo codificado; normalmente decorre da incidencia/local da prestacao. |
| descrição do serviço | descricaoServico | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Texto livre que o cliente precisa ler e aprovar. |
| observações do serviço | observacoes | entrada manual | sim | sim | depende | nao | nao | depende | depende | depende | depende | depende | Campo livre do portal; manter opcional no MVP. |

### 3.7 Valores e informações complementares
Valores monetarios de entrada e texto complementar do documento.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| valores de entrada | valorServicoPrestado | entrada manual | sim | sim | sim | nao | nao | sim | sim | sim | sim | depende | Valor base do servico; alimenta o resumo da previa. |
| valores de entrada | descontoIncondicionado | entrada manual | sim | sim | sim | nao | nao | depende | depende | depende | depende | depende | Desconto sem condicao; opcional no MVP. |
| valores de entrada | descontoCondicionado | entrada manual | sim | sim | sim | nao | nao | depende | depende | depende | depende | depende | Desconto condicionado; opcional no MVP. |
| valores de entrada | valorDeducoes | entrada manual | sim | sim | sim | nao | nao | depende | depende | depende | depende | depende | Deducoes ou retencoes da base; impacta o calculo da previa. |
| informações complementares | informacoesComplementares | entrada manual | sim | sim | sim | nao | nao | depende | depende | depende | depende | depende | Texto livre final; pode aparecer no resumo da DANFSe. |

### 3.8 Prévia calculada
Campos gerados pelo sistema para conferência do cliente e renderização da previa.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| prévia calculada | versao | controle operacional | nao | nao | nao | nao | nao | nao | sim | sim | sim | depende | Versao sequencial da previa por rascunho; gerada pelo sistema. |
| prévia calculada | baseCalculo | derivado/calculado | nao | nao | sim | sim | nao | nao | sim | sim | sim | depende | Valor canônico da base; o portal repete como BC ISSQN e leitura da base. |
| prévia calculada | aliquotaAplicada | derivado/calculado | nao | nao | sim | sim | nao | nao | sim | sim | sim | depende | Pode coincidir com issqnAliquota; equivalencia ainda pendente. |
| prévia calculada | valorIssqn | derivado/calculado | nao | nao | sim | sim | nao | nao | sim | sim | sim | depende | Valor do ISSQN calculado na previa. |
| prévia calculada | valorLiquidoNfse | derivado/calculado | nao | nao | sim | sim | nao | nao | sim | sim | sim | depende | Valor final de conferencia do cliente. |
| prévia calculada | valorTotalNfse | derivado/calculado | nao | nao | sim | sim | nao | nao | depende | depende | depende | depende | Mantido opcional ate validar se e distinto do liquido. |
| prévia calculada | totalTributos | derivado/calculado | nao | nao | sim | sim | nao | nao | depende | depende | depende | depende | Campo agregado de transparencia fiscal; subtotais podem repetir no DANFSe. |
| prévia calculada | totalTributosFederais | derivado/calculado | nao | nao | sim | sim | nao | nao | depende | depende | depende | depende | Transparencia fiscal; opcional no MVP. |
| prévia calculada | totalTributosEstaduais | derivado/calculado | nao | nao | sim | sim | nao | nao | depende | depende | depende | depende | Transparencia fiscal; opcional no MVP. |
| prévia calculada | totalTributosMunicipais | derivado/calculado | nao | nao | sim | sim | nao | nao | depende | depende | depende | depende | Transparencia fiscal; opcional no MVP. |
| prévia calculada | issValorImpostoRetido | derivado/calculado | nao | nao | depende | sim | nao | nao | depende | depende | depende | depende | Retencao de ISS na fonte; diferente de valorIssqn. |
| prévia calculada | pisDebitoApuracaoPropria | derivado/calculado | nao | nao | depende | sim | nao | nao | depende | depende | depende | depende | Resumo federal; regra de apuracao nao fechada. |
| prévia calculada | cofinsDebitoApuracaoPropria | derivado/calculado | nao | nao | depende | sim | nao | nao | depende | depende | depende | depende | Resumo federal; regra de apuracao nao fechada. |
| prévia calculada | irrfRetidoNaFonte | derivado/calculado | nao | nao | depende | sim | nao | nao | depende | depende | depende | depende | Resumo federal; regra de apuracao nao fechada. |
| snapshot/renderização | snapshotJson | snapshot/renderização | nao | nao | nao | nao | nao | nao | sim | sim | sim | depende | Artefato tecnico da renderizacao da previa; nao e dado fiscal bruto. |

### 3.9 Documento emitido / autorizado
Campos oficiais apos autorizacao e retorno do provedor.

| bloco | campo | origem principal | entra no payload do rascunho | editável no rascunho | exibido na prévia | calculado | pós-autorização | obrigatório em `RASCUNHO` | obrigatório em `PRE_VALIDACAO` | obrigatório em `AGUARDANDO_APROVACAO_CLIENTE` | obrigatório em `APROVADO_CLIENTE` | obrigatório em `EMITIDO` | observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| emissão/autorização | statusAutorizacao | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | sim | Comeca em PENDENTE e passa a refletir o retorno do provedor. |
| emissão/autorização | numeroNfse | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | sim | Identificador oficial da nota. |
| emissão/autorização | serieNfse | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | sim | Serie oficial da nota. |
| emissão/autorização | chaveAcessoNfse | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | sim | Chave de acesso oficial. |
| emissão/autorização | codigoVerificacao | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | sim | Codigo de verificacao oficial. |
| emissão/autorização | dataHoraEmissaoNfse | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | sim | Timestamp oficial de emissao. |
| emissão/autorização | dataHoraEmissaoDps | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | nao | Pendente: pode vir do provedor ou do fluxo de DPS. |
| emissão/autorização | protocoloAutorizacao | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | depende | Protocolo de autorizacao; depende do retorno do provedor. |
| emissão/autorização | dataAutorizacao | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | depende | Data de autorizacao; depende do retorno do provedor. |
| emissão/autorização | payloadRetornoProvedor | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | depende | Payload bruto para auditoria e replay; formato depende do provedor. |
| emissão/autorização | xmlAutorizado | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | depende | XML autorizado; guardar quando o provedor disponibilizar. |
| emissão/autorização | jsonAutorizado | retorno do provedor | nao | nao | nao | nao | sim | nao | nao | nao | nao | depende | JSON autorizado; guardar quando o provedor disponibilizar. |

## 4. Pendências mantidas flexíveis no MVP
- `codigoNbs` segue opcional; a regra fiscal local nao ficou fechada no material.
- `tomadorLocalizacao` e `intermediarioLocalizacao` permanecem como controles operacionais opcionais.
- `issqnAliquota` continua como campo do rascunho, mas a equivalencia com `aliquotaAplicada` segue pendente.
- `valorTotalNfse` continua opcional ate a validacao posterior confirmar se e distinto de `valorLiquidoNfse`.
- `snapshotJson` e um artefato tecnico da previa; nao deve contaminar o formulario do rascunho.
- `payloadRetornoProvedor`, `xmlAutorizado` e `jsonAutorizado` dependem do formato que cada provedor devolver.
- `protocoloAutorizacao`, `dataAutorizacao` e `dataHoraEmissaoDps` foram mantidos flexiveis porque a disponibilidade varia por fluxo/provedor.
- Os campos de retencao federal e municipal continuam conservadores porque o material nao fechou todas as regras de obrigatoriedade.

## 5. Leitura operacional
- O formulario opera so com o rascunho e seus campos editaveis; o que for calculado nao deve voltar para a entrada.
- A previa nasce do rascunho validado e passa a concentrar `baseCalculo`, `aliquotaAplicada`, `valorIssqn`, `valorLiquidoNfse` e os demais calculos.
- A aprovacao do cliente congela a leitura da previa; a emissao oficial so deve preencher identificadores e retorno do provedor.
- Campos visuais repetidos no portal/DANFSe ficam canonizados em um unico nome de dominio, com a repeticao documentada nas observacoes.
- `PRE_VALIDACAO`, `AGUARDANDO_APROVACAO_CLIENTE`, `APROVADO_CLIENTE` e `EMITIDO` sao marcos operacionais; no Prisma eles se relacionam, respectivamente, com a validacao previa, a previa gerada, a aprovacao e a autorizacao final.
