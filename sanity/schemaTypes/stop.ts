import { defineField, defineType } from 'sanity'

export const stop = defineType({
  name: 'stop',
  title: 'Stop',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Campsite', value: 'campsite' },
          { title: 'City', value: 'city' },
          { title: 'Attraction', value: 'attraction' },
          { title: 'Rest Stop', value: 'rest' },
          { title: 'Event', value: 'event' },
          { title: 'Ferry/Tunnel', value: 'transport' },
        ],
      },
      initialValue: 'campsite',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'geopoint',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
    }),
    defineField({
      name: 'arrivalDate',
      title: 'Arrival Date',
      type: 'date',
    }),
    defineField({
      name: 'departureDate',
      title: 'Departure Date',
      type: 'date',
    }),
    defineField({
      name: 'nights',
      title: 'Nights',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'bookingReference',
      title: 'Booking Reference',
      type: 'string',
    }),
    defineField({
      name: 'bookingUrl',
      title: 'Booking URL',
      type: 'url',
    }),
    defineField({
      name: 'cost',
      title: 'Cost',
      type: 'number',
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'EUR',
      options: {
        list: [
          { title: 'Euro (€)', value: 'EUR' },
          { title: 'British Pound (£)', value: 'GBP' },
          { title: 'Hungarian Forint (Ft)', value: 'HUF' },
          { title: 'Swiss Franc (CHF)', value: 'CHF' },
        ],
      },
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
            {
              name: 'takenAt',
              type: 'datetime',
              title: 'Taken At',
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      type: 'type',
      country: 'country',
      media: 'photos.0',
    },
    prepare({ title, type, country, media }) {
      const typeEmoji: Record<string, string> = {
        campsite: '⛺',
        city: '🏙️',
        attraction: '🎯',
        rest: '☕',
        event: '🎫',
        transport: '🚢',
      }
      return {
        title: `${typeEmoji[type] || '📍'} ${title}`,
        subtitle: country,
        media,
      }
    },
  },
})
