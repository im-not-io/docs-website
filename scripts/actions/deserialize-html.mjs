#!/usr/bin/env node

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { rehypeRemark } from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import remarkMdxjs from 'remark-mdxjs';
import { defaultHandlers, heading } from 'hast-util-to-mdast';
import { u } from 'unist-builder';
import { last } from 'lodash';

const handlers = require('./utils/handlers');
const yaml = require('js-yaml');
const { configuration } = require('./configuration');

const component = (h, node) => {
  if (!node.properties || !node.properties.dataType) {
    return defaultHandlers[node.tagName](h, node);
  }

  const { dataType, dataComponent } = node.properties;

  if (dataType === 'prop') {
    return null;
  }

  const key =
    dataType === 'component' ? dataComponent || node.tagName : dataType;

  const handler = handlers[key];

  if (!handler || !handler.deserialize) {
    throw new Error(
      `Unable to deserialize node: '${key}'. Please specify a deserializer in 'scripts/actions/utils/handlers.js'`
    );
  }

  return handler.deserialize(h, node);
};

const headingWithCustomId = (h, node) => {
  const result = heading(h, node);
  const { id } = node.properties || {};

  if (!id) {
    return result;
  }

  const value = `#${id}`;
  const lastChild = last(result.children);
  const linkReference = u(
    'linkReference',
    {
      identifier: value,
      label: value,
      referenceType: 'shortcut',
    },
    [u('text', value)]
  );

  if (lastChild.type === 'text' && !lastChild.value.match(/\s$/)) {
    lastChild.value = `${lastChild.value} `;
  } else {
    result.children.push(u('text', ' '));
  }

  result.children.push(linkReference);

  return result;
};

const stripTranslateFrontmatter = () => {
  const transformer = (tree) => {
    if (tree?.children[0]?.type === 'yaml') {
      const frontmatterObj = yaml.load(tree.children[0].value);
      delete frontmatterObj.translate;
      delete frontmatterObj.redirects;
      frontmatterObj.translationType = configuration.TRANSLATION.TYPE;
      const frontmatterStr = yaml
        .dump(frontmatterObj, { lineWidth: -1 })
        .trim();
      tree.children[0].value = frontmatterStr;
      return tree;
    }
  };

  return transformer;
};

const processor = unified()
  .use(remarkParse)
  .use(rehypeRemark, {
    handlers: {
      code: component,
      table: component,
      thead: component,
      tbody: component,
      tr: component,
      td: component,
      th: component,
      span: component,
      div: component,
      pre: component,
      var: component,
      mark: component,
      h1: headingWithCustomId,
      h2: headingWithCustomId,
      h3: headingWithCustomId,
      h4: headingWithCustomId,
      h5: headingWithCustomId,
      h6: headingWithCustomId,
    },
  })
  .use(remarkStringify, {
    bullet: '*',
    fences: true,
    listItemIndent: '1',
  })
  .use(remarkMdx)
  .use(remarkMdxjs)
  .use(remarkFrontmatter, ['yaml'])
  .use(stripTranslateFrontmatter);

const deserializeHTML = async (html) => {
  const { contents } = await processor.process(html);

  return contents.trim();
};

export default deserializeHTML;
