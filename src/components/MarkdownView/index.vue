<template>
  <div class="markdown-view" v-html="renderedMarkdown"></div>
</template>

<script setup>
import { useClipboard } from '@vueuse/core'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import "highlight.js/styles/github.css"
import vue from 'highlight.js/lib/languages/xml'
import html from "highlight.js/lib/languages/xml"
hljs.registerLanguage("vue", vue)
hljs.registerLanguage("html", html)

const { proxy } = getCurrentInstance()
const { copy, isSupported } = useClipboard();

// 定义组件属性
const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

function copyToClipboard(str) {
  if (isSupported) {
    copy(str);
    proxy.$modal.msgSuccess("复制成功");
  } else {
    proxy.$modal.msgError("您的浏览器不支持剪贴板API");
  }
}

if (typeof window !== "undefined") {
  window.copyToClipboard = copyToClipboard;
}

const clipboard = "nextElementSibling && (window.copyToClipboard(nextElementSibling.innerText))";

const md = new MarkdownIt({
  highlight: (str, lang) => {
    const langHtml = lang ? `<div style="position: absolute; left: 10px; top: 5px; color: #6b7280;">${lang}</div>` : ""
    const copyHtml = `<div onclick="${clipboard}" style="position: absolute; right: 10px; top: 5px; color: #444;cursor: pointer;">复制</div>`
    if (str && hljs.getLanguage(lang)) {
      return `<pre style="position: relative;">${langHtml}${copyHtml}<code class="hljs">${hljs.highlight(str || "", { language: lang, ignoreIllegals: true }).value}</code></pre>`
    }
    return `<pre style="position: relative;">${langHtml}${copyHtml}<code class="hljs">${str}</code></pre>`
  }
})

/** 渲染 markdown */
const renderedMarkdown = computed(() => {
  return md.render(props.content)
})
</script>

<style lang="scss" scoped>
.markdown-view {
  font-size: 0.95rem;
  line-height: 1.4rem;
  color: var(--el-text-color-primary);
  padding: 12px 12px 0 12px;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    color: var(--el-text-color-primary);
  }

  :deep(h1) {
    font-size: 2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(h2) {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(h3) {
    font-size: 1.25em;
  }

  :deep(h4) {
    font-size: 1em;
  }

  :deep(h5) {
    font-size: 0.875em;
  }

  :deep(h6) {
    font-size: 0.85em;
    color: var(--el-text-color-secondary);
  }

  :deep(p) {
    margin-top: 0;
    margin-bottom: 12px;
  }

  :deep(ul),
  :deep(ol) {
    margin-top: 0;
    margin-bottom: 12px;
    padding-left: 2em;
  }

  :deep(ul) {
    list-style-type: disc;
  }

  :deep(ol) {
    list-style-type: decimal;
  }

  :deep(li) {
    margin-bottom: 4px;
    line-height: 1.6;

    > ul,
    > ol {
      margin-top: 4px;
      margin-bottom: 4px;
    }
  }

  :deep(pre) {
    margin: 0 0 12px 0;
    overflow-x: auto;
    font-size: 95%;
    line-height: 1.45;
    border-radius: 8px;

    code {
      border-radius: 8px;
      padding-top: 45px;
      color: var(--el-text-color-primary);
      background-color: var(--el-bg-color-page);
    }
  }

  :deep(table) {
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 12px;
    width: 100%;
    overflow: auto;
    display: block;

    th,
    td {
      padding: 6px 13px;
      border: 1px solid var(--el-border-color-lighter);
    }

    th {
      font-weight: 600;
      background-color: var(--el-fill-color-light);
    }

    tr {
      background-color: var(--el-bg-color);
      border-top: 1px solid var(--el-border-color-lighter);

      &:nth-child(2n) {
        background-color: var(--el-fill-color-lighter);
      }
    }
  }

  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--el-color-primary-light-3);
      text-decoration: underline;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    box-sizing: content-box;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    margin: 8px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(hr) {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: var(--el-border-color-lighter);
    border: 0;
    border-radius: 2px;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}
</style>
