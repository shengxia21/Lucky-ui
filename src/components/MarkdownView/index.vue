<template>
  <div class="markdown-view" v-html="renderedMarkdown"></div>
</template>

<script setup name="MarkdownView">
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
      return `<pre style="position: relative;">${langHtml}${copyHtml}<code class="hljs" style="border-radius: 8px;padding-top: 45px;">${hljs.highlight(str || "", { language: lang, ignoreIllegals: true }).value}</code></pre>`
    }
    return `<pre style="position: relative;">${langHtml}${copyHtml}<code class="hljs" style="border-radius: 8px;padding-top: 45px;">${str}</code></pre>`
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
  font-weight: 400;
  line-height: 1.6rem;
  letter-spacing: 0em;
  color: #3b3e55;
  max-width: 100%;
}
</style>
