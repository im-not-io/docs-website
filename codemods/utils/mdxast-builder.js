import { u } from 'unist-builder';

const mdxAttribute = (name, value) => u('mdxAttribute', { name, value });
const mdxValueExpression = (value) => u('mdxValueExpression', value);
const mdxBlockExpression = (value) => u('mdxBlockExpression', value);
const mdxSpanExpression = (value) => u('mdxSpanExpression', value);

const mdxSpanElement = (name, attributes = [], children = []) =>
  u('mdxSpanElement', { attributes, name }, children);

const mdxBlockElement = (name, attributes = [], children = []) =>
  u('mdxBlockElement', { attributes, name }, children);

const mdxImport = (expression, path) =>
  u('import', `import ${expression} from '${path}'`);

module.exports = {
  mdxAttribute,
  mdxBlockElement,
  mdxBlockExpression,
  mdxImport,
  mdxSpanElement,
  mdxSpanExpression,
  mdxValueExpression,
};
