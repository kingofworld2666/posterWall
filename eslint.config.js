import eslintPluginVue from 'eslint-plugin-vue';
import eslintJs from '@eslint/js';

export default [
  eslintJs.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  {
    rules: {
      // 在这里添加或覆盖规则
      'vue/multi-word-component-names': 'off', // 暂时关闭组件名必须多词的规则，如果需要可以开启
      'vue/no-empty-component-block': 'warn', // 对于空的 <template>, <script>, <style> 块给出警告
      'no-empty': ['warn', { allowEmptyCatch: true }] // 允许空的 catch 块，但其他空块给出警告
    }
  }
];
