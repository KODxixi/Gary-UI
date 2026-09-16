(() => {
  "use strict";

  const SESSION_ID_PATTERN = /^[a-z0-9][a-z0-9-]{7,63}$/;
  const NODE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
  const LAYOUT_VALUES = Object.freeze([
    "as-proposed",
    "split-emphasis",
    "balanced-grid",
    "single-flow"
  ]);
  const MAX_COMBINATIONS = 12;
  const CLOSED_STATES = new Set(["approved", "implementing", "verified", "closed"]);
  const LABELS = {
    mode: {
      quick: "QUICK",
      compare: "COMPARE",
      "deep-review": "DEEP REVIEW"
    },
    status: {
      created: "已创建",
      proposal_ready: "提案已就绪",
      awaiting_feedback: "等待你的反馈",
      feedback_received: "Agent 已收到反馈",
      revising: "Agent 正在修订",
      approved: "设计已批准",
      implementing: "正在实施",
      verified: "已经验证",
      closed: "Session 已关闭",
      corrupt: "状态损坏"
    },
    application: {
      board: "看板模式",
      "scroll-report": "滚动 / 演示汇报",
      "web-ui": "Web UI"
    },
    stack: {
      html: "HTML",
      "react-shadcn": "React / shadcn",
      other: "其他"
    },
    kind: {
      recommended: "RECOMMENDED",
      alternative: "ALTERNATIVE",
      stretch: "STRETCH PROPOSAL"
    },
    intent: {
      keep: "保留",
      adjust: "调整",
      delete: "删除",
      question: "疑问"
    },
    priority: {
      must: "MUST",
      should: "SHOULD",
      could: "COULD"
    },
    layout: {
      "as-proposed": "沿用提案",
      "split-emphasis": "分区强调",
      "balanced-grid": "均衡网格",
      "single-flow": "单线叙事"
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const elements = {
    loading: $("[data-loading-state]"),
    error: $("[data-error-state]"),
    errorMessage: $("[data-error-message]"),
    retry: $("[data-retry]"),
    workspace: $("[data-workspace]"),
    connectionDot: $("[data-connection-dot]"),
    connectionLabel: $("[data-connection-label]"),
    revisionBadge: $("[data-revision-badge]"),
    sessionMode: $("[data-session-mode]"),
    sessionStatus: $("[data-session-status]"),
    taskGoal: $("[data-task-goal]"),
    taskAudience: $("[data-task-audience]"),
    applicationMode: $("[data-application-mode]"),
    targetStack: $("[data-target-stack]"),
    stateLabel: $("[data-state-label]"),
    optionTabs: $("[data-option-tabs]"),
    previewPresence: $("[data-preview-presence]"),
    optionKind: $("[data-option-kind]"),
    optionLabel: $("[data-option-label]"),
    optionBenefit: $("[data-option-benefit]"),
    previewFrame: $("[data-preview-frame]"),
    previewLoading: $("[data-preview-loading]"),
    selectedNode: $("[data-selected-node]"),
    selectionStrip: $(".selection-strip"),
    clearNode: $("[data-clear-node]"),
    understanding: $("[data-understanding]"),
    assumptions: $("[data-assumptions]"),
    recommendation: $("[data-recommendation]"),
    risks: $("[data-risks]"),
    changeSet: $("[data-change-set]"),
    decisionCount: $("[data-decision-count]"),
    openDecisions: $("[data-open-decisions]"),
    confirmedCount: $("[data-confirmed-count]"),
    confirmedDecisions: $("[data-confirmed-decisions]"),
    annotationCount: $("[data-annotation-count]"),
    annotationEmpty: $("[data-annotation-empty]"),
    annotationForm: $("[data-annotation-form]"),
    annotationNode: $("[data-annotation-node]"),
    annotationNote: $("[data-annotation-note]"),
    annotationList: $("[data-annotation-list]"),
    combinationCount: $("[data-combination-count]"),
    combinationEmpty: $("[data-combination-empty]"),
    combinationForm: $("[data-combination-form]"),
    combinationOption: $("[data-combination-option]"),
    combinationNode: $("[data-combination-node]"),
    combinationNote: $("[data-combination-note]"),
    combinationList: $("[data-combination-list]"),
    verificationSection: $("[data-verification-section]"),
    verificationResult: $("[data-verification-result]"),
    verificationSummary: $("[data-verification-summary]"),
    verificationReceipt: $("[data-verification-receipt]"),
    verificationRevision: $("[data-verification-revision]"),
    verificationChecks: $("[data-verification-checks]"),
    verificationSkills: $("[data-verification-skills]"),
    verificationArtifacts: $("[data-verification-artifacts]"),
    feedbackNotes: $("[data-feedback-notes]"),
    submitState: $("[data-submit-state]"),
    submissionHelp: $("[data-submission-help]"),
    approvalDialog: $("[data-approval-dialog]"),
    approvalOption: $("[data-approval-option]"),
    confirmApproval: $("[data-confirm-approval]"),
    requestApproval: $("[data-request-approval]"),
    toast: $("[data-toast]")
  };

  const state = {
    sessionId: "",
    token: "",
    snapshot: null,
    proposalKey: "",
    selectedOptionId: null,
    selectedNodeId: null,
    annotationIntent: "adjust",
    annotationPriority: "must",
    annotations: [],
    combinations: [],
    confirmedDecisions: new Map(),
    lockedDecisions: new Map(),
    controls: {
      theme: "dark",
      material: "regular",
      density: "balanced",
      pageMode: "data-page",
      layout: "as-proposed"
    },
    lastSequence: 0,
    lastApprovalId: null,
    eventSource: null,
    pollTimer: null,
    refreshTimer: null,
    toastTimer: null,
    isLoading: false,
    isSubmitting: false,
    renderedArtifactUrl: ""
  };

  function setText(element, value, fallback = "—") {
    if (!element) return;
    const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
    element.textContent = text || fallback;
  }

  function formatLabel(group, value, fallback = "—") {
    return LABELS[group]?.[value] || value || fallback;
  }

  function listInto(container, values, fallback) {
    const entries = Array.isArray(values)
      ? values.filter((value) => typeof value === "string" && value.trim())
      : [];
    container.replaceChildren();
    if (!entries.length) {
      const item = document.createElement("li");
      item.textContent = fallback;
      container.append(item);
      return;
    }
    entries.forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      container.append(item);
    });
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    setText(elements.toast, message);
    elements.toast.hidden = false;
    state.toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 4200);
  }

  function setConnection(connectionState, label) {
    elements.connectionDot.dataset.state = connectionState;
    setText(elements.connectionLabel, label);
  }

  function setSubmitState(submitState, label) {
    elements.submitState.dataset.state = submitState;
    setText(elements.submitState, label);
  }

  function showFatalError(message) {
    elements.loading.hidden = true;
    elements.workspace.hidden = true;
    elements.error.hidden = false;
    setText(elements.errorMessage, message, "Session 暂时不可用。");
    setConnection("offline", "连接失败");
  }

  function showWorkspace() {
    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.workspace.hidden = false;
  }

  function readSessionParams() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = (params.get("id") || "").trim();
    const token = (params.get("token") || "").trim();

    if (!SESSION_ID_PATTERN.test(sessionId)) {
      throw new Error("Session 地址缺少合法的 id。请让 Agent 重新打开本地共创地址。");
    }
    if (!token || token.length > 512 || /[\u0000-\u001f\u007f]/.test(token)) {
      throw new Error("Session 地址缺少有效的访问 token。请让 Agent 重新打开本地共创地址。");
    }

    state.sessionId = sessionId;
    state.token = token;
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
      method: options.method || "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: options.headers || {},
      body: options.body,
      signal: options.signal
    });

    let payload = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const detail = (
        typeof payload?.error === "string" ? payload.error : payload?.error?.message
      ) || payload?.message || `请求失败（${response.status}）`;
      const error = new Error(detail);
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  function snapshotUrl() {
    return `/api/sessions/${encodeURIComponent(state.sessionId)}?token=${encodeURIComponent(state.token)}`;
  }

  function feedbackUrl() {
    return `/api/sessions/${encodeURIComponent(state.sessionId)}/feedback`;
  }

  function eventsUrl() {
    const after = Number.isInteger(state.lastSequence) ? state.lastSequence : 0;
    return `/api/sessions/${encodeURIComponent(state.sessionId)}/events?token=${encodeURIComponent(state.token)}&after=${after}`;
  }

  function normalizeSnapshot(payload) {
    if (!payload || typeof payload !== "object" || !payload.session || !payload.task) {
      throw new Error("Session 返回的数据不完整，已停止覆盖当前页面。");
    }
    if (payload.session.sessionId !== state.sessionId) {
      throw new Error("Session 身份不匹配，已拒绝显示这份数据。");
    }

    const proposal = payload.activeProposal && typeof payload.activeProposal === "object"
      ? payload.activeProposal
      : null;
    const options = Array.isArray(proposal?.options)
      ? proposal.options.map((option) => ({ ...option }))
      : [];

    return {
      raw: payload,
      session: payload.session,
      task: payload.task,
      proposal: proposal ? { ...proposal, options } : null,
      decisions: payload.decisions || null,
      latestVerification: payload.latestVerification && typeof payload.latestVerification === "object"
        ? payload.latestVerification
        : null,
      activeArtifactUrl: typeof payload.activeArtifactUrl === "string"
        ? payload.activeArtifactUrl
        : null,
      events: payload.events || {}
    };
  }

  async function loadSnapshot({ initial = false } = {}) {
    if (state.isLoading) return;
    state.isLoading = true;
    if (initial) setConnection("polling", "正在连接");

    try {
      const payload = await apiRequest(snapshotUrl());
      const snapshot = normalizeSnapshot(payload);
      const nextProposalKey = snapshot.proposal
        ? `${snapshot.proposal.proposalId}:${snapshot.proposal.revision}`
        : "";
      const isNewProposal = nextProposalKey !== state.proposalKey;

      state.snapshot = snapshot;
      state.lastSequence = Number(
        snapshot.events.lastSequence ??
        snapshot.session.lastEventSequence ??
        state.lastSequence
      ) || 0;

      if (isNewProposal) {
        state.proposalKey = nextProposalKey;
        resetDraftForProposal();
      }
      hydrateConfirmedDecisions(snapshot.decisions?.confirmed);

      renderSnapshot({ isNewProposal });
      showWorkspace();
      if (!state.eventSource && !state.pollTimer) {
        connectEventStream();
      }
    } catch (error) {
      if (initial || !state.snapshot) {
        showFatalError(humanizeRequestError(error));
      } else {
        setConnection("offline", "暂时离线");
        showToast(`刷新失败：${humanizeRequestError(error)}`);
        startPolling();
      }
    } finally {
      state.isLoading = false;
    }
  }

  function humanizeRequestError(error) {
    if (error?.status === 401 || error?.status === 403) {
      return "Session token 已失效或无权访问。请让 Agent 恢复 Session 并打开新的地址。";
    }
    if (error?.status === 404) {
      return "没有找到这个 Session。请确认 Agent 已启动本地共创服务。";
    }
    if (error?.status === 409) {
      return "Session 状态发生冲突，请让 Agent 检查 revision 或恢复状态。";
    }
    return error?.message || "无法连接本地共创服务。";
  }

  function hydrateConfirmedDecisions(rawConfirmed) {
    const confirmed = new Map();
    if (Array.isArray(rawConfirmed)) {
      rawConfirmed.forEach((item) => {
        if (
          item &&
          typeof item.key === "string" &&
          item.key.trim() &&
          typeof item.value === "string"
        ) {
          confirmed.set(item.key, { ...item, key: item.key.trim() });
        }
      });
    }
    state.confirmedDecisions = confirmed;
    confirmed.forEach((_, key) => state.lockedDecisions.delete(key));
  }

  function resetDraftForProposal() {
    const proposal = state.snapshot?.proposal;
    state.selectedOptionId = proposal?.recommendation?.optionId || proposal?.options?.[0]?.optionId || null;
    state.selectedNodeId = null;
    state.annotations = [];
    state.combinations = [];
    state.lockedDecisions = new Map();
    state.annotationIntent = "adjust";
    state.annotationPriority = "must";
    state.lastApprovalId = null;
    state.renderedArtifactUrl = "";
    elements.feedbackNotes.value = "";
    elements.annotationNote.value = "";
    setSubmitState("idle", "未提交");
    setSelectedNode(null);

    const selectedOption = getSelectedOption();
    applyVisualRoute(selectedOption?.visualRoute || {});
  }

  function renderSnapshot({ isNewProposal = false } = {}) {
    const { session, task, proposal } = state.snapshot;
    const brief = task.brief || {};

    document.title = proposal
      ? `${brief.goal || "Gary-UI 共创"} · R${proposal.revision}`
      : `${brief.goal || "Gary-UI 共创"} · 等待提案`;

    setText(elements.sessionMode, formatLabel("mode", session.mode || task.mode));
    setText(elements.sessionStatus, String(session.status || "").replaceAll("_", " ").toUpperCase());
    setText(elements.taskGoal, brief.goal, "共同把方向变成可确认的页面。");
    setText(
      elements.taskAudience,
      brief.audience ? `面向 ${brief.audience}` : "Agent 会把高影响判断放进真实 HTML，而不是只用文字描述。"
    );
    setText(elements.applicationMode, formatLabel("application", task.applicationMode));
    setText(elements.targetStack, formatLabel("stack", task.target?.stack));
    setText(elements.stateLabel, formatLabel("status", session.status));
    setText(elements.revisionBadge, proposal ? `R${proposal.revision}` : "R—");

    if (session.status === "corrupt") {
      setConnection("offline", "状态损坏");
    } else if (state.eventSource?.readyState === EventSource.OPEN) {
      setConnection("live", "Agent 在线监听");
    } else {
      setConnection("polling", "自动刷新中");
    }

    renderProposal(isNewProposal);
    renderThinking();
    renderDecisions();
    renderAnnotations();
    renderCombinations();
    renderVerification();
    renderSubmissionAvailability();
  }

  function renderProposal(isNewProposal) {
    const proposal = state.snapshot.proposal;
    elements.optionTabs.replaceChildren();

    if (!proposal) {
      setText(elements.previewPresence, "Agent 正在准备首个提案");
      setText(elements.optionLabel, "等待提案");
      setText(elements.optionBenefit, "Agent 发布后，这里会出现可操作 HTML。");
      elements.previewFrame.removeAttribute("src");
      elements.previewLoading.hidden = false;
      return;
    }

    proposal.options.forEach((option, index) => {
      const button = document.createElement("button");
      const isSelected = option.optionId === state.selectedOptionId;
      button.type = "button";
      button.id = `option-tab-${safeDomId(option.optionId)}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(isSelected));
      button.setAttribute("aria-controls", "proposal-preview");
      button.tabIndex = isSelected ? 0 : -1;
      button.dataset.optionId = option.optionId;
      button.textContent = option.label;

      const marker = document.createElement("em");
      marker.textContent = option.kind === "recommended"
        ? "推荐"
        : option.kind === "stretch"
          ? "探索"
          : String.fromCharCode(65 + index);
      button.append(marker);
      button.addEventListener("click", () => selectOption(option.optionId));
      button.addEventListener("keydown", handleOptionKeydown);
      elements.optionTabs.append(button);
    });

    const selectedOption = getSelectedOption() || proposal.options[0];
    if (selectedOption && selectedOption.optionId !== state.selectedOptionId) {
      state.selectedOptionId = selectedOption.optionId;
    }

    const previewMode = isSessionReadOnly() ? "只读" : "可操作";
    setText(elements.previewPresence, `Revision ${proposal.revision} · ${previewMode}`);
    setText(elements.optionKind, formatLabel("kind", selectedOption?.kind));
    elements.optionKind.dataset.kind = selectedOption?.kind || "alternative";
    setText(elements.optionLabel, selectedOption?.label, "当前提案");
    setText(elements.optionBenefit, selectedOption?.expectedBenefit, "Agent 尚未说明预期收益。");

    if (isNewProposal || !state.renderedArtifactUrl) {
      applyVisualRoute(selectedOption?.visualRoute || {});
    }
    renderControlValues();
    loadSelectedArtifact();
  }

  function safeDomId(value) {
    return String(value || "option").replace(/[^A-Za-z0-9_-]/g, "-");
  }

  function handleOptionKeydown(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = $$('[role="tab"]', elements.optionTabs);
    const current = tabs.indexOf(event.currentTarget);
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  function getSelectedOption() {
    const options = state.snapshot?.proposal?.options || [];
    return options.find((option) => option.optionId === state.selectedOptionId) || options[0] || null;
  }

  function selectOption(optionId) {
    if (state.selectedOptionId === optionId) return;
    const option = state.snapshot?.proposal?.options?.find((entry) => entry.optionId === optionId);
    if (!option) return;

    state.selectedOptionId = optionId;
    state.selectedNodeId = null;
    setSelectedNode(null);
    applyVisualRoute(option.visualRoute || {});
    renderProposal(false);
    renderThinking();
    renderAnnotations();
    renderCombinations();
    renderSubmissionAvailability();
    showToast(`已切换到「${option.label}」`);
  }

  function applyVisualRoute(route) {
    state.controls = {
      theme: validEnum(route.theme, ["dark", "light"], "dark"),
      material: validEnum(route.material, ["ultrathin", "regular", "thick", "solid-plate"], "regular"),
      density: validEnum(route.density, ["spacious", "balanced", "compact"], "balanced"),
      pageMode: validEnum(route.page || route.pageMode, ["report-cover", "image-page", "data-page", "manual-toc"], "data-page"),
      layout: validEnum(route.layout, LAYOUT_VALUES, "as-proposed")
    };
    applyControlsToPage();
  }

  function validEnum(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }

  function renderControlValues() {
    $$("[data-control]").forEach((control) => {
      const key = control.dataset.control;
      if (state.controls[key] != null) control.value = state.controls[key];
    });
  }

  function applyControlsToPage() {
    document.documentElement.setAttribute("data-gary-theme", state.controls.theme);
    document.documentElement.setAttribute("data-gary-density", state.controls.density);
    document.documentElement.setAttribute("data-gary-material", state.controls.material);
    document.documentElement.setAttribute("data-gary-page-mode", state.controls.pageMode);
    document.documentElement.setAttribute("data-gary-layout", state.controls.layout);
    renderControlValues();
    postToPreview({
      type: "gary-preview-settings",
      controls: { ...state.controls }
    });
  }

  function artifactUrlForSelectedOption() {
    const option = getSelectedOption();
    return option?.artifactUrl || state.snapshot?.activeArtifactUrl || "";
  }

  function validatedArtifactUrl(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl) return "";
    try {
      const url = new URL(rawUrl, window.location.href);
      const expectedPrefix = `/api/sessions/${encodeURIComponent(state.sessionId)}/artifacts/`;
      if (url.origin !== window.location.origin || !url.pathname.startsWith(expectedPrefix)) {
        return "";
      }
      return url.href;
    } catch {
      return "";
    }
  }

  function loadSelectedArtifact() {
    const url = validatedArtifactUrl(artifactUrlForSelectedOption());
    if (!url) {
      state.renderedArtifactUrl = "";
      elements.previewFrame.removeAttribute("src");
      elements.previewLoading.hidden = false;
      setText(elements.previewPresence, "提案 artifact 尚不可用");
      return;
    }
    if (url === state.renderedArtifactUrl) {
      postToPreview({ type: "gary-preview-settings", controls: { ...state.controls } });
      return;
    }

    state.renderedArtifactUrl = url;
    elements.previewLoading.hidden = false;
    elements.previewFrame.id = "proposal-preview";
    elements.previewFrame.src = url;
  }

  function postToPreview(message) {
    if (!elements.previewFrame.contentWindow) return;
    elements.previewFrame.contentWindow.postMessage(message, "*");
  }

  function handlePreviewMessage(event) {
    if (event.source !== elements.previewFrame.contentWindow) return;
    const message = event.data;
    if (!message || typeof message !== "object") return;

    if (message.type === "gary-preview-ready") {
      elements.previewLoading.hidden = true;
      setText(elements.previewPresence, `Revision ${state.snapshot?.proposal?.revision ?? "—"} · ${isSessionReadOnly() ? "只读" : "可操作"}`);
      postToPreview({ type: "gary-preview-settings", controls: { ...state.controls } });
      if (state.selectedNodeId) {
        postToPreview({ type: "gary-highlight-node", nodeId: state.selectedNodeId });
      }
      return;
    }

    if (message.type === "gary-node-selected" && NODE_ID_PATTERN.test(message.nodeId || "")) {
      setSelectedNode(message.nodeId);
      showToast(`已选择元素 ${message.nodeId}`);
    }
  }

  function setSelectedNode(nodeId) {
    state.selectedNodeId = nodeId || null;
    elements.annotationEmpty.hidden = Boolean(nodeId);
    elements.annotationForm.hidden = !nodeId;
    elements.clearNode.hidden = !nodeId;
    elements.selectionStrip.classList.toggle("has-selection", Boolean(nodeId));
    setText(elements.selectedNode, nodeId ? `已选择 · ${nodeId}` : "尚未选择页面元素");
    setText(elements.annotationNode, nodeId);
    if (nodeId) {
      postToPreview({ type: "gary-highlight-node", nodeId });
    } else {
      postToPreview({ type: "gary-highlight-node", nodeId: null });
    }
    renderCombinationComposer();
  }

  function renderThinking() {
    const proposal = state.snapshot?.proposal;
    const option = getSelectedOption();
    setText(elements.understanding, proposal?.understanding, "等待 Agent 发布任务理解。");
    listInto(elements.assumptions, proposal?.assumptions, "尚无公开假设。");
    setText(
      elements.recommendation,
      proposal?.recommendation?.reason || option?.rationale,
      "等待 Agent 说明为什么推荐这个方向。"
    );
    listInto(elements.risks, option?.risks, "尚无已识别风险。");
    listInto(elements.changeSet, proposal?.changeSet, "第一版提案将在这里说明它建立了什么。");
  }

  function currentOpenDecisions() {
    const proposalDecisions = state.snapshot?.proposal?.openDecisions || [];
    return proposalDecisions.filter(
      (decision) => !state.confirmedDecisions.has(decision.id)
    );
  }

  function renderConfirmedDecisions() {
    const confirmed = Array.from(state.confirmedDecisions.values());
    setText(elements.confirmedCount, confirmed.length);
    elements.confirmedDecisions.replaceChildren();

    if (!confirmed.length) {
      const empty = document.createElement("p");
      empty.className = "empty-copy";
      empty.textContent = "当前还没有锁定的决定。";
      elements.confirmedDecisions.append(empty);
      return;
    }

    confirmed.forEach((decision) => {
      const item = document.createElement("div");
      item.className = "confirmed-decision-item";

      const key = document.createElement("span");
      key.textContent = decision.key;
      const value = document.createElement("strong");
      value.textContent = decision.value;
      item.append(key, value);
      elements.confirmedDecisions.append(item);
    });
  }

  function renderDecisions() {
    renderConfirmedDecisions();
    const decisions = currentOpenDecisions();
    elements.openDecisions.replaceChildren();
    setText(elements.decisionCount, decisions.length);

    if (!decisions.length) {
      const empty = document.createElement("p");
      empty.className = "empty-copy";
      empty.textContent = state.confirmedDecisions.size
        ? "已确认项保持锁定；当前没有新的待确认问题。"
        : "当前没有待确认问题。";
      elements.openDecisions.append(empty);
      return;
    }

    decisions.slice(0, 3).forEach((decision) => {
      const item = document.createElement("section");
      item.className = "decision-item";
      item.dataset.decisionId = decision.id;

      const question = document.createElement("p");
      question.textContent = decision.question;
      item.append(question);

      const options = document.createElement("div");
      options.className = "decision-options";
      options.setAttribute("role", "group");
      options.setAttribute("aria-label", decision.question);

      decision.options.forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = value;
        button.disabled = isSessionReadOnly();
        button.setAttribute("aria-pressed", String(state.lockedDecisions.get(decision.id) === value));
        button.addEventListener("click", () => {
          state.lockedDecisions.set(decision.id, value);
          renderDecisions();
          renderSubmissionAvailability();
        });
        options.append(button);
      });

      item.append(options);
      elements.openDecisions.append(item);
    });
  }

  function optionLabel(optionId) {
    const option = state.snapshot?.proposal?.options?.find(
      (entry) => entry.optionId === optionId
    );
    return option?.label || optionId;
  }

  function renderAnnotations() {
    setText(elements.annotationCount, state.annotations.length);
    elements.annotationList.replaceChildren();

    state.annotations.forEach((annotation, index) => {
      const item = document.createElement("li");
      item.className = "annotation-item";

      const meta = document.createElement("div");
      meta.className = "annotation-meta";
      const option = document.createElement("span");
      option.className = "annotation-option";
      option.textContent = optionLabel(annotation.optionId);
      const node = document.createElement("code");
      node.textContent = annotation.nodeId;
      const intent = document.createElement("span");
      intent.textContent = LABELS.intent[annotation.intent];
      const priority = document.createElement("span");
      priority.textContent = LABELS.priority[annotation.priority];
      meta.append(option, node, intent, priority);

      const note = document.createElement("p");
      note.textContent = annotation.note || "无补充说明";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "移除";
      remove.hidden = isSessionReadOnly();
      remove.setAttribute(
        "aria-label",
        `移除 ${optionLabel(annotation.optionId)} 中 ${annotation.nodeId} 的批注`
      );
      remove.addEventListener("click", () => {
        state.annotations.splice(index, 1);
        renderAnnotations();
      });

      item.addEventListener("click", (event) => {
        if (event.target === remove) return;
        if (annotation.optionId !== state.selectedOptionId) {
          selectOption(annotation.optionId);
        }
        setSelectedNode(annotation.nodeId);
        document.querySelector("#proposal-stage")?.scrollIntoView({ block: "start" });
      });
      item.append(meta, note, remove);
      elements.annotationList.append(item);
    });
  }

  function renderCombinationComposer() {
    const hasSource = Boolean(state.selectedOptionId && state.selectedNodeId);
    elements.combinationEmpty.hidden = hasSource;
    elements.combinationForm.hidden = !hasSource;
    setText(elements.combinationOption, optionLabel(state.selectedOptionId));
    setText(elements.combinationNode, state.selectedNodeId);
  }

  function renderCombinations() {
    setText(
      elements.combinationCount,
      `${state.combinations.length} / ${MAX_COMBINATIONS}`
    );
    elements.combinationList.replaceChildren();
    renderCombinationComposer();

    state.combinations.forEach((combination, index) => {
      const item = document.createElement("li");
      item.className = "combination-item";

      const source = document.createElement("div");
      source.className = "combination-item-source";
      const option = document.createElement("strong");
      option.textContent = optionLabel(combination.fromOptionId);
      const region = document.createElement("code");
      region.textContent = combination.regionId;
      source.append(option, region);

      const note = document.createElement("p");
      note.textContent = combination.note;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "移除";
      remove.hidden = isSessionReadOnly();
      remove.setAttribute(
        "aria-label",
        `移除 ${optionLabel(combination.fromOptionId)} 的 ${combination.regionId} 区域组合`
      );
      remove.addEventListener("click", () => {
        state.combinations.splice(index, 1);
        renderCombinations();
      });

      item.addEventListener("click", (event) => {
        if (event.target === remove) return;
        if (combination.fromOptionId !== state.selectedOptionId) {
          selectOption(combination.fromOptionId);
        }
        setSelectedNode(combination.regionId);
        document.querySelector("#proposal-stage")?.scrollIntoView({ block: "start" });
      });
      item.append(source, note, remove);
      elements.combinationList.append(item);
    });
  }

  function validatedEvidenceUrl(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl) return "";
    try {
      const url = new URL(rawUrl, window.location.href);
      const expectedPrefix = `/api/sessions/${encodeURIComponent(state.sessionId)}/evidence/`;
      if (url.origin !== window.location.origin || !url.pathname.startsWith(expectedPrefix)) {
        return "";
      }
      return url.href;
    } catch {
      return "";
    }
  }

  function isImageArtifact(artifact) {
    return (
      artifact?.kind === "screenshot" ||
      /\.(?:avif|gif|jpe?g|png|webp)$/i.test(artifact?.fileName || "")
    );
  }

  function renderVerification() {
    const evidence = state.snapshot?.latestVerification;
    elements.verificationSection.hidden = !evidence;
    if (!evidence) return;

    const result = evidence.result === "pass" ? "pass" : "fail";
    elements.verificationResult.dataset.result = result;
    setText(elements.verificationResult, result === "pass" ? "验证通过" : "验证未通过");
    setText(elements.verificationSummary, evidence.summary, "Agent 尚未提供验证摘要。");
    setText(elements.verificationReceipt, evidence.receiptId);
    setText(elements.verificationRevision, `R${evidence.revision || "—"}`);

    elements.verificationChecks.replaceChildren();
    const checks = Array.isArray(evidence.checks) ? evidence.checks : [];
    checks.forEach((check) => {
      const item = document.createElement("li");
      item.dataset.status = check.status === "pass" ? "pass" : "fail";
      const marker = document.createElement("span");
      marker.textContent = check.status === "pass" ? "PASS" : "FAIL";
      const copy = document.createElement("p");
      const title = document.createElement("strong");
      title.textContent = check.id;
      const summary = document.createElement("span");
      summary.textContent = check.summary;
      copy.append(title, summary);
      item.append(marker, copy);
      elements.verificationChecks.append(item);
    });
    if (!checks.length) {
      const item = document.createElement("li");
      item.className = "empty-copy";
      item.textContent = "没有可展示的检查项。";
      elements.verificationChecks.append(item);
    }

    elements.verificationSkills.replaceChildren();
    const skills = Array.isArray(evidence.skillsUsed) ? evidence.skillsUsed : [];
    skills.forEach((skill) => {
      const item = document.createElement("li");
      item.textContent = skill;
      elements.verificationSkills.append(item);
    });
    if (!skills.length) {
      const item = document.createElement("li");
      item.className = "empty-copy";
      item.textContent = "未记录 Skill。";
      elements.verificationSkills.append(item);
    }

    elements.verificationArtifacts.replaceChildren();
    const artifacts = Array.isArray(evidence.artifacts) ? evidence.artifacts : [];
    artifacts.forEach((artifact) => {
      const url = validatedEvidenceUrl(artifact.url);
      const card = url ? document.createElement("a") : document.createElement("div");
      card.className = "verification-artifact";
      if (url) {
        card.href = url;
        card.target = "_blank";
        card.rel = "noreferrer";
      } else {
        card.dataset.unavailable = "true";
      }

      if (url && isImageArtifact(artifact)) {
        const image = document.createElement("img");
        image.src = url;
        image.alt = artifact.label || "验证截图";
        image.loading = "lazy";
        image.decoding = "async";
        card.append(image);
      } else {
        const glyph = document.createElement("span");
        glyph.className = "artifact-glyph";
        glyph.textContent = artifact.kind === "browser-report" ? "REPORT" : "FILE";
        card.append(glyph);
      }

      const copy = document.createElement("span");
      copy.className = "artifact-copy";
      const label = document.createElement("strong");
      label.textContent = artifact.label || artifact.fileName || "验证附件";
      const meta = document.createElement("small");
      meta.textContent = [artifact.kind, artifact.viewport].filter(Boolean).join(" · ") ||
        (url ? "打开受保护附件" : "附件 URL 不可用");
      copy.append(label, meta);
      card.append(copy);
      elements.verificationArtifacts.append(card);
    });
    if (!artifacts.length) {
      const empty = document.createElement("p");
      empty.className = "empty-copy";
      empty.textContent = "没有可展示的证据附件。";
      elements.verificationArtifacts.append(empty);
    }
  }

  function isSessionReadOnly() {
    const status = state.snapshot?.session?.status;
    return CLOSED_STATES.has(status) || status === "corrupt";
  }

  function renderSubmissionAvailability() {
    const status = state.snapshot?.session?.status;
    const isClosed = isSessionReadOnly();
    const hasProposal = Boolean(state.snapshot?.proposal && getSelectedOption());
    document.documentElement.dataset.sessionReadonly = String(isClosed);

    $$("[data-submit-action], [data-request-approval]").forEach((button) => {
      button.disabled = isClosed || !hasProposal || state.isSubmitting;
    });
    $$(
      "[data-control], [data-annotation-form] button, [data-annotation-form] textarea, " +
      "[data-combination-form] button, [data-combination-form] textarea, [data-feedback-notes]"
    ).forEach((control) => {
      control.disabled = isClosed || state.isSubmitting;
    });

    if (isClosed) {
      const statusLabel = formatLabel("status", status);
      if (status === "approved") {
        const receipt = state.lastApprovalId
          ? `批准回执 ${state.lastApprovalId} 已生成。`
          : "当前 revision 已批准。";
        setText(
          elements.submissionHelp,
          `${receipt} 正在等待 Agent finalize；如果反悔，请把 approvalId 交给 Agent 执行 reopen。页面不会直接 reopen。`
        );
      } else {
        setText(
          elements.submissionHelp,
          `${statusLabel}。当前页面保留为只读证据；finalize 或实施后不能从页面 reopen。`
        );
      }
      if (status === "approved" || status === "implementing" || status === "verified" || status === "closed") {
        setSubmitState("sent", statusLabel);
      }
    } else {
      setText(
        elements.submissionHelp,
        "提交后，Agent 会在同一个 URL 发布下一版；页面不会直接修改 Gary-UI 母本或目标项目。"
      );
    }
  }

  function bindChoiceGroup(container, onChange) {
    $$("button[data-value]", container).forEach((button) => {
      button.addEventListener("click", () => {
        $$("button[data-value]", container).forEach((candidate) => {
          candidate.setAttribute("aria-pressed", String(candidate === button));
        });
        onChange(button.dataset.value);
      });
    });
  }

  function addAnnotation(event) {
    event.preventDefault();
    if (isSessionReadOnly()) return;
    const optionId = state.selectedOptionId;
    const nodeId = state.selectedNodeId;
    const note = elements.annotationNote.value.trim();
    if (!optionId || !nodeId || !NODE_ID_PATTERN.test(nodeId)) {
      showToast("请先在真实页面里选择一个可批注元素。");
      return;
    }
    if (state.annotationIntent !== "keep" && !note) {
      elements.annotationNote.focus();
      showToast("请补充希望 Agent 如何调整这个元素。");
      return;
    }

    const annotation = {
      optionId,
      nodeId,
      intent: state.annotationIntent,
      priority: state.annotationPriority,
      note: note || "保留当前处理"
    };
    const existingIndex = state.annotations.findIndex(
      (item) => item.optionId === optionId && item.nodeId === nodeId
    );
    if (existingIndex >= 0) {
      state.annotations.splice(existingIndex, 1, annotation);
      showToast(`已更新 ${optionLabel(optionId)} · ${nodeId} 的批注`);
    } else {
      state.annotations.push(annotation);
      showToast(`已加入 ${optionLabel(optionId)} · ${nodeId} 的批注`);
    }
    elements.annotationNote.value = "";
    renderAnnotations();
  }

  function addCombination(event) {
    event.preventDefault();
    if (isSessionReadOnly()) return;
    const fromOptionId = state.selectedOptionId;
    const regionId = state.selectedNodeId;
    const note = elements.combinationNote.value.trim();

    if (!fromOptionId || !regionId || !NODE_ID_PATTERN.test(regionId)) {
      showToast("请先选择要借用的方案区域。");
      return;
    }
    if (!note) {
      elements.combinationNote.focus();
      showToast("请说明这个区域要怎样与当前方向组合。");
      return;
    }

    const combination = { regionId, fromOptionId, note };
    const existingIndex = state.combinations.findIndex(
      (item) => item.fromOptionId === fromOptionId && item.regionId === regionId
    );
    if (existingIndex >= 0) {
      state.combinations.splice(existingIndex, 1, combination);
      showToast(`已更新 ${optionLabel(fromOptionId)} · ${regionId} 的组合说明`);
    } else {
      if (state.combinations.length >= MAX_COMBINATIONS) {
        showToast("一轮最多组合 12 个区域，请先移除低优先级项。");
        return;
      }
      state.combinations.push(combination);
      showToast(`已加入 ${optionLabel(fromOptionId)} · ${regionId}`);
    }

    elements.combinationNote.value = "";
    renderCombinations();
    renderSubmissionAvailability();
  }

  function missingApprovalDecision() {
    return currentOpenDecisions().find(
      (decision) => !state.lockedDecisions.has(decision.id)
    ) || null;
  }

  function requestApproval() {
    const missing = missingApprovalDecision();
    if (missing) {
      const target = $(`[data-decision-id="${CSS.escape(missing.id)}"]`, elements.openDecisions);
      target?.scrollIntoView({ block: "center" });
      target?.querySelector("button")?.focus();
      showToast("批准前，请先回答所有待确认问题。");
      return;
    }
    const option = getSelectedOption();
    setText(elements.approvalOption, option?.label, "未选择方案");
    if (typeof elements.approvalDialog.showModal === "function") {
      elements.approvalDialog.showModal();
    } else {
      submitFeedback("approve");
    }
  }

  function buildFeedback(action) {
    const proposal = state.snapshot?.proposal;
    return {
      schemaVersion: 1,
      sessionId: state.sessionId,
      proposalId: proposal.proposalId,
      revision: proposal.revision,
      action,
      selectedOptionId: state.selectedOptionId,
      controls: {
        theme: state.controls.theme,
        material: state.controls.material,
        density: state.controls.density,
        pageMode: state.controls.pageMode,
        layout: state.controls.layout
      },
      annotations: state.annotations.map((annotation) => ({ ...annotation })),
      combinations: state.combinations.map((combination) => ({ ...combination })),
      lockedDecisions: Array.from(state.lockedDecisions, ([key, value]) => ({ key, value })),
      notes: elements.feedbackNotes.value.trim()
    };
  }

  async function submitFeedback(action) {
    if (state.isSubmitting || !state.snapshot?.proposal) return;
    if (action === "approve" && missingApprovalDecision()) {
      requestApproval();
      return;
    }

    state.isSubmitting = true;
    setSubmitState("sending", "发送中");
    renderSubmissionAvailability();

    try {
      const payload = buildFeedback(action);
      const result = await apiRequest(feedbackUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gary-Session-Token": state.token
        },
        body: JSON.stringify(payload)
      });

      setSubmitState("sent", "已送达 Agent");
      state.annotations = [];
      state.combinations = [];
      state.lockedDecisions = new Map();
      elements.feedbackNotes.value = "";
      elements.combinationNote.value = "";
      renderAnnotations();
      renderCombinations();
      renderDecisions();

      if (result?.approvalId) {
        state.lastApprovalId = result.approvalId;
        setText(elements.submissionHelp, `已生成批准回执 ${result.approvalId}。Agent 只能据此锁定当前 revision。`);
        showToast(`已批准当前方案 · ${result.approvalId}`);
      } else {
        showToast(action === "reject" ? "本轮已否决，Agent 已收到" : "反馈已送达 Agent");
      }
      await loadSnapshot();
    } catch (error) {
      setSubmitState("error", "提交失败");
      showToast(`提交失败：${humanizeRequestError(error)}`);
    } finally {
      state.isSubmitting = false;
      renderSubmissionAvailability();
    }
  }

  function scheduleRefresh(delay = 120) {
    window.clearTimeout(state.refreshTimer);
    state.refreshTimer = window.setTimeout(() => loadSnapshot(), delay);
  }

  function connectEventStream() {
    if (!window.EventSource || state.eventSource) {
      if (!window.EventSource) startPolling();
      return;
    }

    const source = new EventSource(eventsUrl());
    state.eventSource = source;
    source.onopen = () => {
      stopPolling();
      setConnection("live", "Agent 在线监听");
    };
    source.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data);
      } catch {
        payload = null;
      }
      const sequence = Number(payload?.sequence);
      if (Number.isInteger(sequence) && sequence > state.lastSequence) {
        state.lastSequence = sequence;
      }
      if (
        payload?.type === "approval_created" &&
        typeof payload?.payload?.approvalId === "string"
      ) {
        state.lastApprovalId = payload.payload.approvalId;
      }
      if (payload?.type === "revision_started") {
        setText(elements.previewPresence, "Agent 正在修订下一版");
      }
      if (payload?.type === "proposal_published") {
        showToast("Agent 已在同一个页面发布新版本");
      }
      scheduleRefresh(payload?.type === "proposal_published" ? 60 : 160);
    };
    source.onerror = () => {
      source.close();
      if (state.eventSource === source) state.eventSource = null;
      setConnection("polling", "轮询更新中");
      startPolling();
    };
  }

  function startPolling() {
    if (state.pollTimer) return;
    setConnection("polling", "轮询更新中");
    state.pollTimer = window.setInterval(() => loadSnapshot(), 4000);
  }

  function stopPolling() {
    if (!state.pollTimer) return;
    window.clearInterval(state.pollTimer);
    state.pollTimer = null;
  }

  function bindNavigation() {
    const links = $$("[data-nav-target]");
    const sections = links
      .map((link) => document.getElementById(link.dataset.navTarget))
      .filter(Boolean);

    links.forEach((link) => {
      link.addEventListener("click", () => {
        links.forEach((candidate) => candidate.classList.toggle("is-active", candidate === link));
      });
    });

    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.navTarget === visible.target.id);
      });
    }, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0.05, 0.3]
    });
    sections.forEach((section) => observer.observe(section));
  }

  function bindEvents() {
    elements.retry.addEventListener("click", () => loadSnapshot({ initial: true }));
    elements.previewFrame.addEventListener("load", () => {
      window.setTimeout(() => {
        elements.previewLoading.hidden = true;
        postToPreview({ type: "gary-preview-settings", controls: { ...state.controls } });
      }, 80);
    });
    window.addEventListener("message", handlePreviewMessage);

    $$("[data-control]").forEach((control) => {
      control.addEventListener("change", () => {
        state.controls[control.dataset.control] = control.value;
        applyControlsToPage();
        showToast("视觉设置已加入本轮反馈");
      });
    });

    elements.clearNode.addEventListener("click", () => setSelectedNode(null));
    elements.annotationForm.addEventListener("submit", addAnnotation);
    elements.combinationForm.addEventListener("submit", addCombination);
    bindChoiceGroup($("[data-annotation-intent]"), (value) => {
      state.annotationIntent = value;
    });
    bindChoiceGroup($("[data-annotation-priority]"), (value) => {
      state.annotationPriority = value;
    });

    $$("[data-submit-action]").forEach((button) => {
      button.addEventListener("click", () => submitFeedback(button.dataset.submitAction));
    });
    elements.requestApproval.addEventListener("click", requestApproval);
    elements.confirmApproval.addEventListener("click", () => {
      elements.approvalDialog.close();
      submitFeedback("approve");
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && state.snapshot) scheduleRefresh(0);
    });
    window.addEventListener("online", () => {
      stopPolling();
      if (!state.eventSource) connectEventStream();
      scheduleRefresh(0);
    });
    window.addEventListener("offline", () => setConnection("offline", "浏览器离线"));
    window.addEventListener("beforeunload", () => {
      state.eventSource?.close();
      stopPolling();
    });
    bindNavigation();
  }

  async function init() {
    bindEvents();
    try {
      readSessionParams();
      await loadSnapshot({ initial: true });
    } catch (error) {
      showFatalError(humanizeRequestError(error));
    }
  }

  init();
})();




