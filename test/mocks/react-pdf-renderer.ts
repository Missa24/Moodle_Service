export const renderToBuffer = jest.fn();

export const Document = jest.fn(() => null);
export const Page = jest.fn(() => null);
export const View = jest.fn(() => null);
export const Text = jest.fn(() => null);
export const Image = jest.fn(() => null);
export const Font = {
  register: jest.fn(),
  registerHyphenationCallback: jest.fn(),
};
export const StyleSheet = {
  create: jest.fn((styles) => styles),
};

const ReactPdfRenderer = {
  renderToBuffer,
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
};

export default ReactPdfRenderer;